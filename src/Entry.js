var Firebase = require('firebase');
var EventEmitter = require('./EventEmitter');

function noop(){}

function Entry(ref){
  this._ref = ref;
  this._key = ref.key();
  this._query = ref.limit(1);
  this._query.on('value', this._onChildAddedFn, noop, this);
  this._events = new EventEmitter();
}

Entry.prototype.set = function (val,cb){
  this._ref.push().setWithPriority({value:val},Firebase.ServerValue.TIMESTAMP,cb);
}

Entry.prototype.ref = function(){
  return this;
}

Entry.prototype.key = function(){
  return this._key;
}

Entry.prototype._onChildAddedFn = function(snap){
  var key = firstChildKey(snap);
  this._events.emit('value', snap.child(key || 'nullValue').child('value'));
}

Entry.prototype.on = function(eventType){
  if(eventType !== 'value') throw new Error('only value events allowed on a journaling entry');
  this._events.on.apply(this._events,arguments);
}

Entry.prototype.once = function(eventType){
  if(eventType !== 'value') throw new Error('only value events allowed on a journaling entry');
  this._events.once.apply(this._events,arguments);
}

Entry.prototype.off = function(){
  this._events.off.apply(this._events,arguments);
}

function firstChildKey(snap){
  var val = snap.val();
  if(val === null) return null;
  var keys = Object.keys(val);
  if(keys.length === 0) return null;
  return keys[0];
}

module.exports = Entry;