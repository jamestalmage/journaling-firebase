'use strict';

var EventEmitter = require('./EventEmitter');
var LeafSnapshot = require('./LeafSnapshot');
var ObjectSnapshot = require('./ObjectSnapshot');
var utils = require('./utils');
var FakeRef = require('./FakeRef');

function TreeNode(key, parent){
  this._parent = parent || null;
  this._events = new EventEmitter();
  this._children = {};
  this._valueChildren = {};
  this._childrenToFlush = [];
  this._valueSnap = null;
  this._value = null;
  this._pendingValue = null;
  this._changed = false;
  this._changeRegistered = false;
  this._key = key;
  this.initialized = false;
  this._initializeNextFlush = false;
}

TreeNode.prototype.flushChanges = function(){
  var changedChildren = this._childrenToFlush;
  this._changeRegistered = false;
  var initializing = this._initializeNextFlush;
  if(initializing) {
    this._initializeNextFlush = false;
    this.initialized = true;
  }
  if(changedChildren.length){
    this._childrenToFlush = [];
    changedChildren.forEach(function(child){
      child.flushChanges();
    });
  }
  if(this._changed || initializing){
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
  if(this.initialized){
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

TreeNode.prototype.key = function(){
  return this._key;
};

TreeNode.prototype.setValue = function(value){
  var initializeNextFlush = this._initializeNextFlush = !this.initialized;
  var changed = this._changed = this._setValue(value);
  if(changed || initializeNextFlush){
    this._scheduleFlush();
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
        var child = children[j] = new TreeNode(j, this);
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

TreeNode.prototype._scheduleFlush = function(){
  if(!this._changeRegistered){
    this._changeRegistered = true;
    var parent = this._parent;
    if(parent){
      parent._scheduleChildFlush(this);
    }
  }
};

TreeNode.prototype._scheduleChildFlush = function(child){
  this._childrenToFlush.push(child);
  this._scheduleFlush();
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
        children.push(this._valueChildren[i]._buildValueSnap());
      }
    }
    //TODO: Sort Children According To OrderByXXX
    //TODO: Create Meaningful Refs
    return new ObjectSnapshot(new FakeRef('https://blah.com/' + this.key()), children, null);
  }
  else {
    return new LeafSnapshot(new FakeRef('https://blah.com/' + this.key()), this._value, null);
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
  this._scheduleFlush();
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
    child = children[key] = new TreeNode(key,this);
    if(this.initialized){
      child.setValue(null);
      child.flushChanges();
    }
  }
  return child;
};

module.exports = TreeNode;