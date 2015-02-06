'use strict';

var EventEmitter = require('./EventEmitter');
var FakeSnapshot = require('./FakeSnapshot');
var utils = require('./utils');


function FirebaseProxy(firebaseWrapper){
  this._wrapper = firebaseWrapper;
  this._data = {};
  this._listeners = {};
}


FirebaseProxy.prototype.on = function (path, eventType, callback, cancelCallback, context){
  var wrapper = this._wrapper;
  var listeners = this._listeners;
  var data = this._data;
  var initialized = listeners['.initialized'];

  for(var i = 0, len = path.length; i < len; i++){
    var propName = path[i];
    listeners = listeners[propName] || (listeners[propName] = {});
    initialized = initialized || (listeners && listeners['.initialized']);
    data = (data || null) && data[propName];
  }

  if(!listeners['.on_value']){
    path = path.slice();
    var self = this;
    var listener = listeners['.on_value'] = function(snap){
      self.handleCallback(path.slice(), 'value', snap);
    };
    wrapper.on(path, 'value', listener);
  }
  var events = listeners['.events'] || (listeners['.events'] = new EventEmitter());
  events.on(eventType,callback);

  if(initialized){
    callback(new FakeSnapshot(path.join('/'),data));
  }
};

FirebaseProxy.prototype.on_value = function (path, value, priority){
  var listeners = this._listeners;
  var data = this._data;

  value = utils.mergePriority(value, priority);

  var propName;
  for(var i = 0, len = path.length -1; i <= len; i++){
    propName = path[i];
    listeners = listeners && listeners[propName];
    if(i !== len){
      data = data[propName] || (data[propName] =  {});
    }
  }
  var oldValue = data[propName];
  data[propName] = value;
  callListeners(path, value, oldValue, listeners);
};

function callListeners(path, value, oldValue, listeners){
  var changed = !(value === oldValue || ((typeof value === 'object') && (typeof oldValue === 'object')));

  var keyCache = {};
  var i;

  if(typeof value === 'object' && value !== null){
    for( i in value){
      if (value.hasOwnProperty(i) && i.charAt(0) !== '.'){
        keyCache[i] = true;
        path.push(i);

        changed = callListeners(
          path,
          value[i],
          oldValue && oldValue.hasOwnProperty(i) ? oldValue[i] : null,
          listeners && listeners[i]
        ) || changed;

        path.pop();
      }
    }
    if(!changed && value.hasOwnProperty('.priority')){
      changed = !(oldValue && (value['.priority'] === oldValue['.priority']))
    }
    if(!changed && value.hasOwnProperty('.value')){
      changed = !(oldValue && (value['.value'] === oldValue['.value']))
    }
  }

  if(typeof oldValue === 'object' && oldValue !== null){
    for(i in oldValue){
      if (!keyCache[i] && oldValue.hasOwnProperty(i) && i.charAt(0) !== '.'){
        keyCache[i] = true;
        changed = true;
        path.push(i);

        callListeners(
          path,
          null, // we know the new value does not have this property
          oldValue[i],
          listeners && listeners[i]
        );

        path.pop();
      }
    }
    if(!changed && oldValue.hasOwnProperty('.priority')){
      changed = !(value && (value['.priority'] === oldValue['.priority']))
    }
  }

  if(listeners){
    for( i in listeners){
      if(!keyCache[i] && listeners.hasOwnProperty(i) && i.charAt(0) !== '.'){
        path.push(i);

        callListeners(path,null,null,listeners[i]);

        path.pop();
      }
    }
  }

  if(changed || (listeners && !listeners['.initialized'])){
    if(listeners) {
      (listeners['.initialized'] = true);
    }
    var events = listeners && listeners['.events'];
    if(events){
      events.emit('value',new FakeSnapshot(path.join('/'),value));
    }
  }
  return changed;
}

FirebaseProxy.prototype.handleCallback = function(){
  throw new Error('handleCallback not implemented');
};


module.exports = FirebaseProxy;