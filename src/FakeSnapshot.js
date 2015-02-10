'use strict';

var utils = require('./utils');

function makeConstructor(priMergeFn){
  return function SnapshotConstructor(uri,val,pri){
    uri = utils.parseUri(uri);
    val = priMergeFn(val,pri);
    pri = utils.extractPriority(val);
    this._export = val;
    this._val = utils.valueCopy(val);
    this._key = uri.key;
    this._uri = uri.uri;
    this._parent = uri.parent;
    this._pri = pri;
  };
}

var FakeSnapshot = makeConstructor(utils.cloneWithPriority);
var UnsafeSnapshot = makeConstructor(utils.mergePriority);
FakeSnapshot.Unsafe = UnsafeSnapshot;

function ChildSnapshot(uri,expVal,val){
  uri = utils.parseUri(uri);
  this._export = expVal;
  this._val = val;
  this._key = uri.key;
  this._uri = uri.uri;
  this._parent = uri.parent;
  this._pri = utils.extractPriority(expVal);
}

UnsafeSnapshot.prototype = ChildSnapshot.prototype = FakeSnapshot.prototype;

FakeSnapshot.prototype.exists = function(){
  return this._val !== null;
};

FakeSnapshot.prototype.val = function(){
  return utils.clone(this._val);
};

FakeSnapshot.prototype.child = function(path){
  utils.validatePath(path);
  var pathArray = path.split('/');
  var val = this._val;
  var exp = this._export;
  var len = pathArray.length;
  var i = 0;
  while(val && i < len){
    var propName = pathArray[i];
    val = val[propName];
    exp = exp[propName];
    i++;
  }
  if(i < len || val === undefined){
    return new ChildSnapshot(this._uri + '/' + path, null, null);
  }
  return new ChildSnapshot(this._uri + '/' + path, exp, val);
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
      if(cb(snaps[i]) === true) return true;
    }
  }
  return false;
};

FakeSnapshot.prototype.hasChild = function(path){
  return this.child(path).exists();
};

FakeSnapshot.prototype.hasChildren = function(){
  return this.numChildren() !== 0;
};

FakeSnapshot.prototype.key = function(){
  return this._key;
};

FakeSnapshot.prototype.name = function(){
  return this.key();
};

FakeSnapshot.prototype.numChildren = function(){
  var val = this._val;
  return (val && typeof val === 'object' && Object.getOwnPropertyNames(val).length) || 0;
};

FakeSnapshot.prototype.ref = function(){};

FakeSnapshot.prototype.getPriority = function(){
  return this._pri;
};

FakeSnapshot.prototype.exportVal = function(){
  return utils.clone(this._export);
};

module.exports = FakeSnapshot;