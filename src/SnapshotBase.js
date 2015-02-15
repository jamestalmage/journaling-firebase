module.exports = SnapshotBase;

var LeafSnapshot = require('./LeafSnapshot');

function SnapshotBase(ref, priority){
  this._ref = ref;
  this._priority = priority;
}

SnapshotBase.prototype._pathToArray = function(path){
  path = path.split('/');
  if(path[path.length-1] === ''){
    path.pop();
  }
  return path;
};

SnapshotBase.prototype.exists = function(){
  return this.val() !== null;
};

SnapshotBase.prototype.key = function(){
  return this._ref.key();
};

SnapshotBase.prototype.name = function(){
  return this.key();
};

SnapshotBase.prototype.getPriority = function(){
  return this._priority;
};

SnapshotBase.prototype.ref = function(){
  return this._ref;
};

SnapshotBase.prototype._emptyChild = function(path){
  return new LeafSnapshot(this.ref().child(path), null, null);
};


function abstractMethod(){
  throw new Error('abstractMethod');
}

SnapshotBase.prototype.child = abstractMethod;
SnapshotBase.prototype._immediateChild = abstractMethod;
SnapshotBase.prototype.forEach = abstractMethod;
SnapshotBase.prototype.hasChild = abstractMethod;
SnapshotBase.prototype.hasChildren = abstractMethod;
SnapshotBase.prototype.numChildren = abstractMethod;
SnapshotBase.prototype.val = abstractMethod;
SnapshotBase.prototype.exportVal = abstractMethod;


