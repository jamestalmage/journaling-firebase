module.exports = Emitter;

function Emitter(obj) {
  if (obj) return mixin(obj);
}

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
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
  if (0 == arguments.length) {
    this._callbacks = {};
    return;
  }

  // specific event
  var callbacks = this._callbacks[eventType];
  if (!callbacks) return;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[eventType];
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
      return;
    }
  }
};

Emitter.prototype.emit = function(eventType){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[eventType];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var spec, i = 0, len = callbacks.length; i < len; ++i) {
      spec = callbacks[i];
      spec[0].apply(spec[1], args);
    }
  }

  return this;
};

Emitter.prototype.cancel = function(eventType){
  if(!this._callbacks) return;
  var cbObj;
  if(eventType){
    cbObj = {};
    cbObj[eventType] = this._callbacks[eventType] || [];
    delete this._callbacks[eventType];
  }
  else {
    cbObj = this._callbacks;
    delete this._callbacks;
  }
  var args = [].slice.call(arguments, 1);
  for (var e in cbObj){
    /* istanbul ignore else  */
    if(cbObj.hasOwnProperty(e)){
      var callbacks = cbObj[e];
      for(var spec, i = 0, len = callbacks.length; i < len; i++){
        spec = callbacks[i];
        spec[2].apply(spec[1],args);
      }
    }
  }
};

Emitter.prototype.listeners = function(eventType){
  this._callbacks = this._callbacks || {};
  return (this._callbacks[eventType] || []).map(function(spec){return spec[0]});
};

Emitter.prototype.hasListeners = function(eventType){
  if(eventType){
    return !! this.listeners(eventType).length;
  }
  var callbacks = this._callbacks;
  if(callbacks){
    for(var i in callbacks){
      if(callbacks.hasOwnProperty(i) && this.hasListeners(i)){
        return true;
      }
    }
  }
  return false;
};