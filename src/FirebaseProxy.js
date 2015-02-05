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

  for(var i = 0, len = path.length; i < len; i++){
    var propName = path[i];
    listeners = listeners[propName] || (listeners[propName] = {});
    data = data && data[propName];
  }

  var listenerProp = '.on_' + eventType;
  if(!listeners[listenerProp]){
    path = path.slice();
    var self = this;
    var listener = listeners[listenerProp] = function(snap){
      self.handleCallback(path.slice(), eventType, snap);
    };
    wrapper.on(path, eventType, listener);
  }
  var events = listeners['.events'] || (listeners['.events'] = new EventEmitter());
  events.on(eventType,callback);

  if(data){
    callback(new FakeSnapshot(path.join('/'),data));
  }

};

FirebaseProxy.prototype.on_value = function (path, value, priority){
  var listeners = this._listeners;
  var data = this._data;

  value = utils.mergePriority(value, priority);

  for(var i = 0, len = path.length -1; i <= len; i++){
    var propName = path[i];
    listeners = listeners && listeners[propName];
    data = data[propName] || (data[propName] = i == len ? value : {});
  }
  callListeners(path, value, listeners);
};

function callListeners(path, value, listeners){
  if(!listeners) return;

  for(var i in listeners){
    if (listeners.hasOwnProperty(i) && i.charAt(0) !== '.'){
      path.push(i);
      callListeners(path, value && value.hasOwnProperty(i) && value[i], listeners[i]);
      path.pop();
    }
  }
  var events = listeners['.events'];
  if(events){
    events.emit('value',new FakeSnapshot(path.join('/'),value));
  }
}

FirebaseProxy.prototype.handleCallback = function(){
  throw new Error('handleCallback not implemented');
};


module.exports = FirebaseProxy;