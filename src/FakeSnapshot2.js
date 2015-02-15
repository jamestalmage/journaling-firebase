var utils = require('./utils');

  function makeSnapshot(ref, _value, _priority){
    var value = getValue(_value);
    var priority = getPriority(_value, _priority);
    if(typeof value === 'object' && value !== null){
      var children = [];
      for(var i in value){
        if(value.hasOwnProperty(i) && i.charAt(0) !== '.'){
          var child = makeSnapshot(ref.child(i), value[i]);
          if(child.exists()){
            children.push(child);
          }
        }
      }
      children.sort(utils.orderByPriorityComparator);
      return new ObjectSnapshot(ref, children, priority);
    } else {
      return new LeafSnapshot(ref, value, priority);
    }
  }

function SnapshotBase(ref, priority){
  this._ref = ref;
  this._priority = priority;
}

  function pathToArray(path){
    path = path.split('/');
    if(path[path.length-1] === ''){
      path.pop();
    }
    return path;
  }

  //TODO: move to utils
  function getPriority(value, priority){
    if(getValue(value) === null) return null;
    if(typeof value === 'object' && value.hasOwnProperty('.priority')){
      priority = value['.priority'];
    }
    if(priority === undefined) return null;
    return priority;
  }

  //TODO: move to utils
  function getValue(value){
    if(value === null || value === undefined) return null;
    if(typeof value === 'object' && value.hasOwnProperty('.value')){
      return getValue(value['.value']);
    }
    return value;
  }

  SnapshotBase.prototype._pathToArray = pathToArray;
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

  SnapshotBase.prototype.child = abstractMethod;
  SnapshotBase.prototype._immediateChild = abstractMethod;
  SnapshotBase.prototype.forEach = abstractMethod;
  SnapshotBase.prototype.hasChild = abstractMethod;
  SnapshotBase.prototype.hasChildren = abstractMethod;
  SnapshotBase.prototype.numChildren = abstractMethod;
  SnapshotBase.prototype.val = abstractMethod;
  SnapshotBase.prototype.exportVal = abstractMethod;




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



function abstractMethod(){
  throw new Error('abstractMethod');
}


module.exports = makeSnapshot;
