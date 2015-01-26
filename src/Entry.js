var Firebase = require('firebase');

function Entry(ref){
  this._ref = ref;
  this._key = ref.key();
  this._query = ref.limit(1);
  this._query.on('value', this._onChildAddedFn, null, this);
}

Entry.prototype.get = function(){
  return this._value;
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
  this._value = entry ? entry.value : null;
}

function firstChild(val){
  if(val === null) return null;
  var keys = Object.keys(val);
  if(keys.length === 0) return null;
  return val[keys[0]];
}

module.exports = Entry;