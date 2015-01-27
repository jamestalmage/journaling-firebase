/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var Firebase = __webpack_require__(1);
	var EventEmitter = __webpack_require__(2);

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
	  var key = firstChildKey(snap);
	  this._events.emit('value', snap.child(key || 'nullValue').child('value'));
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

	function firstChildKey(snap){
	  var val = snap.val();
	  if(val === null) return null;
	  var keys = Object.keys(val);
	  if(keys.length === 0) return null;
	  return keys[0];
	}

	module.exports = Entry;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = Firebase;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

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
	  return !! this.listeners(eventType).length;
	};

/***/ }
/******/ ])