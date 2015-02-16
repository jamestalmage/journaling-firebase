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
  //this._listeningChildren = {};
  //this._forgettableChildren = {};
  this._valueSnap = null;
  this._value = null;
  this._priority = null;
  this._pendingValue = null;
  this._pendingPriority = null;
  this._changed = false;
  this._ref = ref;
  this._initialized = false;
  this._initializeNextFlush = false;
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
    //TODO: Create Meaningful Refs
    //TODO: Include priority
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

/*TreeNode.prototype._hasLocalListeners = function(){
  return this._events.hasListeners();
};

TreeNode.prototype._hasChildren = function(){
  return !!(Object.getOwnPropertyNames(this._children).length);
};

TreeNode.prototype._registerAsForgettable = function(){
  var parent = this._parent;
  if(parent) parent._registerChildAsForgettable(this);
};

TreeNode.prototype._registerChildAsForgettable = function(child){
  this._forgettableChildren[child.key()] = child;
  if(!this._hasLocalListeners()) {
    this._registerAsForgettable();
  }
};

TreeNode.prototype._hasForgettableChildren = function(){
  return !!(Object.getOwnPropertyNames(this._forgettableChildren).length);
};

TreeNode.prototype._deregisterAsForgettable = function(){
  var parent = this._parent;
  if(parent) parent._deregisterChildAsForgettable(this);
};

TreeNode.prototype._deregisterChildAsForgettable = function(child){
  delete this._forgettableChildren[child.key()];
  if(!this._hasForgettableChildren()){
    this._deregisterAsForgettable();
  }
};

TreeNode.prototype.forget = function(){
  this._root._forget();
};

TreeNode.prototype._forget = function(){
  if(this._hasLocalListeners()) return;
  var forgettable = this._forgettableChildren;
  for(var i in forgettable){
    if(forgettable.hasOwnProperty(i)){
      forgettable[i]._forget();
    }
  }
};

TreeNode.prototype._destroy = function(){
  var parent = this._parent;
  if(parent) parent._forgetChild(this);
};

TreeNode.prototype._forgetChild = function(child){
  var key = child.key();
  delete this._children[key];
  delete this._valueChildren[key];
  delete this._forgettableChildren[key];
};
 */
/*

TreeNode.prototype._listening = function(){
  return !(this._hasListeners() || Object.getOwnPropertyNames(this._listeningChildren).length);
};

TreeNode.prototype._registerAsListening = function(){
  var parent = this._parent;
  if(parent) parent._registerChildAsListening(this);
};

TreeNode.prototype._registerChildAsListening = function(child){
  this._listeningChildren[child.key()] = child;
  this._registerAsListening();
};

TreeNode.prototype._deregisterAsListening = function(){
  var parent = this._parent;
  if(parent) parent._deregisterChildAsListening(this);
};

TreeNode.prototype._deregisterChildAsListening = function(child){
  delete this._listeningChildren[child.key()];
  if(this._listening()){
    this._deregisterAsListening();
  }
};
    */
/**
 * Called if we know this child to currently be empty.
 * @private
 */
TreeNode.prototype._initEmpty = function(){
  this._initialized = true;
  this._valueSnap = this._buildValueSnap();
};

module.exports = TreeNode;