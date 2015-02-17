'use strict';

var EventEmitter = require('./EventEmitter');
var LeafSnapshot = require('./LeafSnapshot');
var ObjectSnapshot = require('./ObjectSnapshot');
var FlushQueue = require('./FlushQueue');
var utils = require('./utils');
var FakeRef = require('./FakeRef');
var dict = require('dict');

function TreeNode(ref, parent){
  this._parent = parent || null;
  if (parent) {
    //this._root = parent._root;
    this._rootQueue = parent._rootQueue;
    this._flushQueue = parent._flushQueue.childRegistration(this, '_flush');
  } else {
    //this._root = this;
    this._rootQueue = new FlushQueue();
    this._flushQueue = this._rootQueue.childRegistration(this, '_flush');
  }
  this._events = new EventEmitter();
  this._children = dict();
  this._valueChildren = dict();
  this._listeningChildren = dict();
  this._forgettableChildren = dict();
  this._valueSnap = null;
  this._value = null;
  this._priority = null;
  this._pendingValue = null;
  this._pendingPriority = null;
  this._changed = false;
  this._ref = ref;
  this._initialized = false;
  this._initializeNextFlush = false;
  this._markForgettable();
}

TreeNode.prototype.flushChanges = function() {
  this._rootQueue.flush();
};

TreeNode.prototype._flush = function(){
  var initializing = this._initializeNextFlush;
  if(initializing) {
    this._initializeNextFlush = false;
    this._initialized = true;
  }
  var changed = this._changed;
  if(changed || initializing){
    this._changed = false;
    this._value = this._pendingValue;
    this._priority = this._pendingPriority;
    var oldSnap = this._valueSnap;
    var newSnap = this._buildValueSnap();
    this._valueSnap = newSnap;
    if (newSnap.exists()) {
      if(!(oldSnap && oldSnap.exists())){
        this._registerValue();
        this._emitEventOnParent('child_added', newSnap);
      }
      else {
        this._emitEventOnParent('child_changed', newSnap);
      }
    } else {
      if(oldSnap && oldSnap.exists()){
        this._deregisterValue();
        this._emitEventOnParent('child_removed', oldSnap);
      }
    }
    this._events.emit('value', newSnap);
  }
};

TreeNode.prototype.on = function(eventType, callback, cancelCallback, context) {
  this._events.on.apply(this._events,arguments);
  this._unmarkForgettable();
  this._markListening();
  if(this._initialized){
    switch (eventType){
      case 'value':
        callback(this._valueSnap);
        break;

      case 'child_added':
        this._valueSnap.forEach(function(snap){
          callback(snap);
        });
        break;
    }
  }
};

/*
  This is "clever". EventEmitter.once() wraps the supplied callback in one that calls
 EventEmitter.off() and then executes the callback. We need the wrapper to call
 off() on the TreeNode (not the EventEmitter) - so we can `markForgettable()` etc.
 */
TreeNode.prototype.once = EventEmitter.prototype.once;

TreeNode.prototype.off = function(eventType, callback, cancelCallback, context){
  this._events.off.apply(this._events, arguments);
  if(!this._events.hasListeners()){
    this._unmarkListening();
    if(this._forgettableChildren.size || !this._children.size){
      this._markForgettable();
    }
  }
};

TreeNode.prototype.ref = function(){
  return this._ref;
};

TreeNode.prototype.key = function(){
  return this._ref.key();
};

TreeNode.prototype.initialized = function(){
  return this._initialized;
};

TreeNode.prototype.setValue = function(value){
  var initializeNextFlush = this._initializeNextFlush = !this._initialized;
  var changed = this._changed = this._setValue(value);
  if(changed || initializeNextFlush){
    this._flushQueue.schedule();
  }
  return changed;
};

TreeNode.prototype._setValue = function(value){
  if(typeof value === 'object' && value !== null){
    if(value.hasOwnProperty('.value')){
      return this._setLeafValue(value['.value'], value['.priority']);
    }
    return this._setObjectValue(value);
  }
  else {
    return this._setLeafValue(value, null);
  }
};

TreeNode.prototype._setObjectValue = function(value){
  var children = this._children;
  var changed = false;
  children.forEach(function(child, key){
    changed = child.setValue(value.hasOwnProperty(key) ? value[key] : null) || changed;
  }, this);
  for(var j in value){
    if(value.hasOwnProperty(j) && !children.has(j) && j.charAt(0) !== '.'){
      var child = children.set(j, new TreeNode(this.ref().child(j), this));
      changed = child.setValue(value[j]) || changed;
    }
  }
  if(value.hasOwnProperty('.priority')){
    var priority = value['.priority'];
    this._pendingPriority = priority;
    changed = priority !== this._priority || changed;
  }
  return changed;
};

TreeNode.prototype._setLeafValue = function(value, priority){
  var children = this._children;
  children.forEach(function(child){
    child.setValue(null);
  });
  this._pendingValue = value;
  this._pendingPriority = priority;
  return value !== this._value || priority !== this._priority;
};

TreeNode.prototype._registerValue = function(){
  if(this._parent) this._parent._registerValueChild(this);
};

TreeNode.prototype._deregisterValue = function(){
  if(this._parent) this._parent._deregisterValueChild(this);
};

TreeNode.prototype._registerValueChild = function(child){
  this._valueChildren.set(child.key(), child);
};

TreeNode.prototype._deregisterValueChild = function(child){
  this._valueChildren.delete(child.key());
};

TreeNode.prototype._hasValueChildren = function(){
  return !!this._valueChildren.size;
};

TreeNode.prototype._buildValueSnap = function(){
  if(this._hasValueChildren()){
    var children = [];
    this._valueChildren.forEach(function(child, key){
      this.push(child._valueSnap);
    }, children);
    //TODO: Sort Children According To OrderByXXX
    return new ObjectSnapshot(this.ref(), children, this._priority);
  }
  else {
    return new LeafSnapshot(this.ref(), this._value, this._priority);
  }
};

TreeNode.prototype.child = function(path,create){
  path = path.split('/');
  var child = this;
  var i,len;
  if (create) {
    for (i = 0, len = path.length; i < len; i++) {
      child = child._getOrCreateChild(path[i]);
    }
  } else {
    for (i = 0, len = path.length; child && i < len; i++) {
      child = child._getChild(path[i]);
    }
  }
  return child;
};

TreeNode.prototype._emitChildEvent = function (eventType, snap){
  this._events.emit(eventType,snap);
  this._changed = true;
};

TreeNode.prototype._emitEventOnParent = function(eventType, snap){
  if(this._parent) this._parent._emitChildEvent(eventType,snap);
};

TreeNode.prototype._getChild = function(key){
  return this._children.get(key, null);
};

TreeNode.prototype._getOrCreateChild = function(key){
  var children = this._children;
  var child = children.get(key);
  if(!child){
    child = children.set(key, new TreeNode(this.ref().child(key),this));
    if(this._initialized){
      child._initEmpty();
    }
  }
  return child;
};

/**
 * Called if we know this child to currently be empty.
 * @private
 */
TreeNode.prototype._initEmpty = function(){
  this._initialized = true;
  this._valueSnap = this._buildValueSnap();
};

module.exports = TreeNode;

TreeNode.prototype._destroy = function(){
  this._children.clear();
  this._valueChildren.clear();
  this._forgettableChildren.clear();
  this._initialized = false;
  this._initializeNextFlush = false;
  this._flushQueue.cancel();
  var parent = this._parent;
  if(parent){
    parent._dropChild(this);
  }
};

TreeNode.prototype._dropChild = function(child){
  var key = child.key();
  this._children.delete(key);
  this._valueChildren.delete(key);
  this._forgettableChildren.delete(key);
};

TreeNode.prototype.forget = function(){
  if(this._events.hasListeners()) return;
  this._forgettableChildren.forEach(function(child){
    child.forget();
  });
  if(!this._isListening()){
    this._destroy();
  }
};

TreeNode.prototype._markForgettable = function(){
  var parent = this._parent;
  if(parent){
    parent._markChildForgettable(this);
  }
};

TreeNode.prototype._markChildForgettable = function(child){
  this._forgettableChildren.set(child.key(), child);
};

TreeNode.prototype._unmarkForgettable = function(){
  var parent = this._parent;
  if(parent){
    parent._unmarkChildForgettable(this);
  }
};

TreeNode.prototype._unmarkChildForgettable = function(child){
  this._forgettableChildren.delete(child.key());
};

TreeNode.prototype._isListening = function(){
  return (this._events.hasListeners() || !!this._listeningChildren.size);
};

TreeNode.prototype._markListening = function(){
  var parent = this._parent;
  if(parent){
    parent._markChildListening(this);
  }
};

TreeNode.prototype._markChildListening = function(child){
  this._listeningChildren.set(child.key(), child);
  this._markListening();
};

TreeNode.prototype._unmarkListening = function(){
  var parent = this._parent;
  if(parent){
    parent._unmarkChildListening(this);
  }
};

TreeNode.prototype._unmarkChildListening = function(child){
  this._listeningChildren.delete(child.key());
  if(!this._isListening()){
    this._unmarkListening();
  }
};