module.exports = ObjectSnapshot;

var SnapshotBase = require('./SnapshotBase');

function ObjectSnapshot(ref, children, priority){
  SnapshotBase.call(this, ref, priority);
  this._children = children;
  this.__childMap = null;
}

ObjectSnapshot.prototype = new SnapshotBase();

ObjectSnapshot.prototype.child = function(path){
  return this._getChild(path) || this._emptyChild(path);
};

ObjectSnapshot.prototype._getChild = function(path){
  path = this._pathToArray(path);
  var child = this;
  for(var i = 0, len = path.length; child && i < len; i++){
    child = child._immediateChild(path[i]);
  }
  return child;
};

ObjectSnapshot.prototype._immediateChild = function(key){
  return this._childMap()[key];
};

ObjectSnapshot.prototype._childMap = function(){
  var childMap = this.__childMap;
  if(!childMap){
    childMap = this.__childMap = {};
    this.forEach(function(snap){
      childMap[snap.key()] = snap;
    });
  }
  return childMap;
};

ObjectSnapshot.prototype.forEach = function(callback){
  var childArray = this._children;
  for(var i = 0, len = childArray.length; i < len; i++){
    if(callback(childArray[i]) === true){
      return true;
    }
  }
  return false;
};

ObjectSnapshot.prototype.hasChild = function(path){
  return !!this._getChild(path);
};

ObjectSnapshot.prototype.hasChildren = function(){
  return true;
};

ObjectSnapshot.prototype.numChildren = function(){
  return this._children.length;
};

ObjectSnapshot.prototype.val = function(){
  var val = {};
  this.forEach(function(snap){
    val[snap.key()] = snap.val();
  });
  return val;
};

ObjectSnapshot.prototype.exportVal = function(){
  var val = {};
  this.forEach(function(snap){
    val[snap.key()] = snap.exportVal();
  });
  if(this._priority !== null){
    val['.priority'] = this._priority;
  }
  return val;
};
