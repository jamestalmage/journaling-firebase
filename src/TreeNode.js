'use strict';

function TreeNode(key, parent){
  this._parent = parent || null;
  this._callbacks = null;
  this._children = {};
  this._changedChildren = [];
  this._value = null;
  this._pendingValue = null;
  this._changed = false;
  this.key = key;
  this.initialized = false;
  this._initializeNextFlush = false;
}

require('./EventEmitter')(TreeNode.prototype);

TreeNode.prototype.flushChanges = function(){
  var changedChildren = this._changedChildren;
  if(changedChildren.length){
    this._changedChildren = [];
    changedChildren.forEach(function(child){
      child.flushChanges();
    });
  }
  if(this._changed || this._initializeNextFlush){
    this._changed = false;
    this._value = this._pendingValue;
    this.emit('value');
  }
  if(this._initializeNextFlush) {
    this._initializeNextFlush = false;
    this.initialized = true;
  }
};

TreeNode.prototype.setValue = function(value){
  this._initializeNextFlush = !this.initialized;
  return (this._changed = this._setValue(value));
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
    if(changed){
      this._registerChange();
    }
    return changed;
  }
  else {
    this._pendingValue = value;
    if(value !== this._value){
      this._registerChange();
      return true;
    }
    return false;
  }
};

TreeNode.prototype._registerChange = function(){
  if(!this._changed){
    this._changed = true;
    var parent = this._parent;
    if(parent){
      parent._registerChangedChild(this);
    }
  }
};

TreeNode.prototype._registerChangedChild = function(child){
  this._changedChildren.push(child);
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

TreeNode.prototype._getChild = function(key){
  return this._children[key] || null;
};

TreeNode.prototype._getOrCreateChild = function(key){
  var children = this._children;
  return children[key] || (children[key] = new TreeNode(key,this));
};

module.exports = TreeNode;

