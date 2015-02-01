'use strict';

var utils = require('./utils');

function FakeSnapshot(uri,val,pri){
  uri = utils.parseUri(uri);
  val = copy(val);
  if(val && val.hasOwnProperty('.priority')){
    pri = val['.priority'];
  }
  if(!pri && pri !== 0 && pri !== ''){
    pri = null;
  }
  if(pri !== null){
    val['.priority'] = pri;
  }
  this._export = val;
  this._val = utils.valueCopy(val);
  this._key = uri.key;
  this._uri = uri.uri;
  this._parent = uri.parent;
  this._pri = pri;
}

FakeSnapshot.prototype.exists = function(){
  return this.val() !== null;
};

FakeSnapshot.prototype.val = function(){
  return copy(this._val);
};

FakeSnapshot.prototype._childVal = function(path){
  utils.validatePath(path);
  var pathArray = path.split('/');
  var val = this._export;
  var len = pathArray.length;
  var i = 0;
  while(val && i < len){
    val = val[pathArray[i]];
    i++;
  }
  return i < len ? null : (val === undefined ? null : val);
};

FakeSnapshot.prototype.child = function(path){
  return new FakeSnapshot(this._uri + '/' + path, this._childVal(path));
};

FakeSnapshot.prototype.forEach = function(cb){
  if(this.hasChildren()){
    var snaps = [];
    var propNames = Object.getOwnPropertyNames(this._val);
    var i, len = propNames.length;
    for(i = 0; i < len; i++){
      snaps.push(this.child(propNames[i]));
    }
    snaps.sort(utils.orderByPriorityComparator);
    len = snaps.length;
    for(i = 0; i < len; i++){
      if(cb(snaps[i]) === true) return;
    }
  }
};

FakeSnapshot.prototype.hasChild = function(path){
  return this._childVal(path) !== null;
};

FakeSnapshot.prototype.hasChildren = function(){
  var val = this._val;
  return (val || false) && typeof val === 'object' && Object.getOwnPropertyNames(val).length !== 0;
};

FakeSnapshot.prototype.key = function(){
  return this._key;
};

FakeSnapshot.prototype.name = function(){
  return this.key();
};

FakeSnapshot.prototype.numChildren = function(){}

FakeSnapshot.prototype.ref = function(){}

FakeSnapshot.prototype.getPriority = function(){
  return this._pri;
}

FakeSnapshot.prototype.exportVal = function(){}

module.exports = FakeSnapshot;



function copy(val){
  return val === undefined ? null : JSON.parse(JSON.stringify(val));
}