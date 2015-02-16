'use strict';

var EventEmitter = require('./EventEmitter');
var LeafSnapshot = require('./LeafSnapshot');
var ObjectSnapshot = require('./ObjectSnapshot');
var FlushQueue = require('./FlushQueue');
var utils = require('./utils');
var FakeRef = require('./FakeRef');

function TreeNode(ref, parent){
  this._parent = parent || null;
  if (parent) {
    this._rootQueue = parent._rootQueue;
    this._flushQueue = parent._flushQueue.childRegistration(this, '_flush');
  } else {
    this._rootQueue = new FlushQueue();
    this._flushQueue = this._rootQueue.childRegistration(this, '_flush');
  }
  this._events = new EventEmitter();
  this._children = {};
  this._valueChildren = {};
  this._valueSnap = null;
  this._value = null;
  this._pendingValue = null;
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
    this.emit('value', newSnap);
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

TreeNode.prototype.emit = function(){
  this._events.emit.apply(this._events,arguments);
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
  if(typeof value === 'object' && value !==null){
    var children = this._children;
    var changed = false;
    for(var i in children){
      /* istanbul ignore else */
      if(children.hasOwnProperty(i)){
        changed = children[i].setValue(value.hasOwnProperty(i) ? value[i] : null) || changed;
      }
    }
    for(var j in value){
      if(value.hasOwnProperty(j) && !children.hasOwnProperty(j)){
        var child = children[j] = new TreeNode(this.ref().child(j), this);
        changed = child.setValue(value[j]) || changed;
      }
    }
    return changed;
  }
  else {
    this._pendingValue = value;
    return value !== this._value;
  }
};

TreeNode.prototype._registerValue = function(){
  if(this._parent) this._parent._registerValueChild(this);
};

TreeNode.prototype._deregisterValue = function(){
  if(this._parent) this._parent._deregisterValueChild(this);
};

TreeNode.prototype._registerValueChild = function(child){
  this._valueChildren[child.key()] = child;
};

TreeNode.prototype._deregisterValueChild = function(child){
  delete this._valueChildren[child.key()];
};

TreeNode.prototype._hasValueChildren = function(){
  return !!(Object.getOwnPropertyNames(this._valueChildren).length);
};

TreeNode.prototype._buildValueSnap = function(){
  if(this._hasValueChildren()){
    var children = [];
    for(var i in this._valueChildren){
      /* istanbul ignore else */
      if(this._valueChildren.hasOwnProperty(i)){
        children.push(this._valueChildren[i]._valueSnap);
      }
    }
    //TODO: Sort Children According To OrderByXXX
    //TODO: Create Meaningful Refs
    //TODO: Include priority
    return new ObjectSnapshot(this.ref(), children, null);
  }
  else {
    return new LeafSnapshot(this.ref(), this._value, null);
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
  return this._children[key] || null;
};

TreeNode.prototype._getOrCreateChild = function(key){
  var children = this._children;
  var child = children[key];
  if(!child){
    child = children[key] = new TreeNode(this.ref().child(key),this);
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