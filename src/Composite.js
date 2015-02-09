'use strict';

var Leaf = require('./Leaf');
var utils = require('./utils');
var FakeSnapshot = require('./FakeSnapshot');
var EventEmitter = require('./EventEmitter');

function Composite(compRef,storageRef){
  this._compRef = compRef;
  this._storageRef = storageRef;
  this._data = {};
  this._leafs = {};
  this._listeners = {};
  this._events = new EventEmitter();
  compRef.on('child_added',function(leafRefSnap){
    var leafVal = leafRefSnap.val();
    if(leafVal === null) return;
    var key = leafRefSnap.key();
    var leafRef = this._storageRef.child(leafVal);
    var leaf = this._leafs[key] = new Leaf(leafRef);
    leaf.on('value',function(snap){
      this._data[key] = utils.mergePriority(snap.exportVal(),leafRefSnap.getPriority());
      this._events.emit('value', new FakeSnapshot(compRef.toString(),this._data));
    },this);
  },this);
}

function validateEventType(eventType){
  if(eventType !== 'value') throw new Error('only value events allowed on a journaling composite');
  return eventType;
}

Composite.prototype.on = function(eventType){
  validateEventType(eventType);
  this._events.on.apply(this._events,arguments);
};

Composite.prototype.once = function(eventType){
  validateEventType(eventType);
  this._events.once.apply(this._events,arguments);
};

Composite.prototype.off = function(){
  this._events.off.apply(this._events,arguments);
};

module.exports = Composite;