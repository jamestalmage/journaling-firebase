var Firebase = require('firebase');
var EventEmitter = require('./EventEmitter');

function Entry(ref){
  this._ref = ref;
  this._key = ref.key();
  this._query = ref.limit(1);
  this._query.on('value', this._onChildAddedFn, null, this);
  this._events = new EventEmitter();
}

Entry.prototype.set = function (val){
  this.ref().push().setWithPriority({value:val},Firebase.ServerValue.TIMESTAMP);
}

Entry.prototype.ref = function(){
  return this._ref;
}

Entry.prototype.key = function(){
  return this._key;
}

Entry.prototype._onChildAddedFn = function(snap){
  var entry = firstChild(snap.val());
  this._events.emit('value',entry ? entry.value : null);
}

Entry.prototype.on = function(){
  this._events.on.apply(this._events,arguments);
}

Entry.prototype.once = function(){
  this._events.once.apply(this._events,arguments);
}

Entry.prototype.off = function(){
  this._events.off.apply(this._events,arguments);
}

function firstChild(val){
  if(val === null) return null;
  var keys = Object.keys(val);
  if(keys.length === 0) return null;
  return val[keys[0]];
}

module.exports = Entry;