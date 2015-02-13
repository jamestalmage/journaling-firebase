'use strict';

function TreeNode(){
  this._callbacks = null;
  this._children = {};
  this._value = undefined;
  this._pending_value = undefined;
}

require('./EventEmitter')(TreeNode.prototype);

TreeNode.prototype.setValue = function(value){
  if(value === undefined) {
    value = null;
  }
  this._pending_value = value;
  return this._value !== this._pending_value;
};

TreeNode.prototype.flushChanges = function(){
  if(this._value !== this._pending_value){
    this._value = this._pending_value;
    this.emit('value');
  }
};

TreeNode.prototype.isInitialized = function(){
  return this._value !== undefined;
};

module.exports = TreeNode;

