'use strict';

module.exports = Emitter;

function Emitter(obj) {
  if (obj) return mixin(obj);
  this._cbSize = 0;
  this._callbacks = null;
}

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  obj._cbSize = 0;
  obj._callbacks = null;
  return obj;
}

function noop(){}

Emitter.prototype.on = function(eventType, callback, cancelCallback, context){
  if(arguments.length == 3 && typeof cancelCallback != 'function'){
    context = cancelCallback;
    cancelCallback = noop;
  }

  this._callbacks = this._callbacks || {};
  (this._callbacks[eventType] = this._callbacks[eventType] || [])
    .push([callback, context || null, cancelCallback || noop]);


  this._cbSize = (this._cbSize || 0) + 1;

  return callback;
};

Emitter.prototype.once = function(eventType, successCallback, failureCallback, context){
  if(arguments.length == 3 && typeof failureCallback != 'function'){
    context = failureCallback;
    failureCallback = noop;
  }

  var self = this;
  function on() {
    self.off(eventType, on, context);
    successCallback.apply(context, arguments);
  }
  on.fn = successCallback;

  this.on(eventType, on, failureCallback, context);
  return successCallback;
};

Emitter.prototype.off = function(eventType, callback, context){
  this._callbacks = this._callbacks || {};

  // all
  if (0 === arguments.length) {
    this._callbacks = null;
    this._cbSize = 0;
    return;
  }

  // specific event
  var callbacks = this._callbacks[eventType];
  if (!callbacks) return;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[eventType];
    this._cbSize -= callbacks.length;
    return;
  }

  // remove specific handler
  context = context || null;
  var spec, cb;
  for (var i = 0; i < callbacks.length; i++) {
    spec = callbacks[i];
    cb = spec[0];
    if (context === spec[1] && (cb === callback || cb.fn === callback)) {
      callbacks.splice(i, 1);
      this._cbSize--;
      return;
    }
  }
};

Emitter.prototype.emit = function(eventType){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1);
  var callbacks = this._callbacks[eventType];

  if (callbacks) {
    callAllSpecs(callbacks.slice(0), args, 0);
  }

  return this;
};

Emitter.prototype.cancel = function(eventType){
  if(!this._callbacks) return;
  var args = [].slice.call(arguments, 1);
  var callbacks;
  if(eventType){
    callbacks = this._callbacks[eventType];
    if(!callbacks) return;
    delete this._callbacks[eventType];
    this._cbSize -= callbacks.length;
    callAllSpecs(callbacks, args, 2);
  }
  else {
    callbacks = this._callbacks;
    this._callbacks = null;
    this._cbSize = 0;
    for (var e in callbacks){
      /* istanbul ignore else  */
      if(callbacks.hasOwnProperty(e)){
        callAllSpecs(callbacks[e], args, 2);
      }
    }
  }
};

function callAllSpecs(callbacks, args, specIndex){
  for(var spec, i = 0, len = callbacks.length; i < len; i++){
    spec = callbacks[i];
    spec[specIndex].apply(spec[1],args);
  }
}

Emitter.prototype.listeners = function(eventType){
  this._callbacks = this._callbacks || {};
  return (this._callbacks[eventType] || []).map(function(spec){return spec[0];});
};

Emitter.prototype.hasListeners = function(eventType){
  if(eventType){
    var callbacks = this._callbacks;
    if(!callbacks) return false;
    callbacks = callbacks[eventType];
    if(!callbacks) return false;
    return !! callbacks.length;
  }
  return !!this._cbSize;
};