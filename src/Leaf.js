var Firebase = require('firebase');
var EventEmitter = require('./EventEmitter');

function noop(){}

function Leaf(ref){
  this._ref = ref;
  this._key = ref.key();
  this._query = ref.limit(1);
  this._events = new EventEmitter();
  this._query.on('value', this._onValueFn, noop, this);
}

Leaf.prototype.set = function (val,cb){
  this._ref.push().setWithPriority(
    {
      value:val,
      time:Firebase.ServerValue.TIMESTAMP
    },
    Firebase.ServerValue.TIMESTAMP,
    cb
  );
};

Leaf.prototype.ref = function(){
  return this;
};

Leaf.prototype.key = function(){
  return this._key;
};

//Must implement or angularFire throws an exception
Leaf.prototype.transaction = noop;

Leaf.prototype._onValueFn = function(snap){
  var key = firstChildKey(snap);
  this._currentValue = snap.child(key || 'nullValue').child('value');
  this._events.emit('value', this._currentValue);
};

Leaf.prototype.on = function(eventType, callback, cancelCallback, context){
  if(eventType !== 'value') throw new Error('only value events allowed on a journaling leaf');
  if(arguments.length == 3 && typeof cancelCallback != 'function'){
    context = cancelCallback;
    // cancelCallback = noop;
  }
  if(this._currentValue){
    callback.call(context,this._currentValue);
  }
  this._events.on.apply(this._events,arguments);
};

Leaf.prototype.once = function(eventType, callback, cancelCallback, context){
  if(eventType !== 'value') throw new Error('only value events allowed on a journaling leaf');
  if(arguments.length == 3 && typeof cancelCallback != 'function'){
    context = cancelCallback;
    // cancelCallback = noop;
  }
  if(this._currentValue){
    callback.call(this,this._currentValue);
  } else {
    this._events.once.apply(this._events,arguments);
  }
};

Leaf.prototype.off = function(){
  this._events.off.apply(this._events,arguments);
};

function firstChildKey(snap){
  var val = snap.val();
  if(val === null) return null;
  var keys = Object.keys(val);
  if(keys.length === 0) return null;
  return keys[0];
}

module.exports = Leaf;