module.exports = LeafSnapshot;

var SnapshotBase = require('./SnapshotBase');

function LeafSnapshot(ref, value, priority){
  SnapshotBase.call(this,ref,priority);
  this._value = value;
}

LeafSnapshot.prototype = new SnapshotBase();

LeafSnapshot.prototype.child = SnapshotBase.prototype._emptyChild;

LeafSnapshot.prototype._immediateChild = function(key){
  return null;
};

LeafSnapshot.prototype.forEach = function(){
  return false;
};

LeafSnapshot.prototype.hasChild = function(){
  return false;
};

LeafSnapshot.prototype.hasChildren = function(){
  return false;
};

LeafSnapshot.prototype.numChildren = function(){
  return 0;
};

LeafSnapshot.prototype.val = function(){
  return this._value;
};

LeafSnapshot.prototype.exportVal = function(){
  if(this._priority === null){
    return this._value;
  }
  else {
    return {
      '.value':this._value,
      '.priority':this._priority
    };
  }
};
