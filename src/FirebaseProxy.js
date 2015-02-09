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
  var listening = listeners['.listening'];

  for(var i = 0, len = path.length; i < len; i++){
    var propName = path[i];
    listeners = listeners[propName] || (listeners[propName] = {});
    initialized = initialized || (listeners && listeners['.initialized']);
    listening = listening || (listeners && listeners['.listening']);
    data = (data || null) && data[propName];
  }

  if(!listening){
    listeners['.listening'] = true;
    wrapper.startWatching(path.join('/'));
  }
  var events = listeners['.events'] || (listeners['.events'] = new EventEmitter());
  events.on(eventType,callback);

  if(initialized){
    callback(new FakeSnapshot(path.join('/'),data));
  }
};

FirebaseProxy.prototype.off = function(path, eventType, callback, cancelCallback, context){
  var listeners = this._listeners;

  for(var i = 0, len = path.length; i < len; i++){
    var propName = path[i];
    if(!(listeners = listeners[propName])){
      return;
    }
  }

  var events = listeners['.events'];

  if(events){
    events.off(eventType,callback);
    if(!events.hasListeners()){
      this._wrapper.stopWatching(path.join('/'));
    }
  }
};

/*FirebaseProxy.prototype.on_value = function (path, value, priority){
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
  // data[propName] = value;
  var newValue = callListeners(path, value, oldValue, listeners);
  if(newValue !== oldValue){
    this._data = utils.mergeCopy(data,path,newValue)
  }
};/* */

FirebaseProxy.prototype.on_value = function(path, value, priority){
  var listeners = this._listeners;
  var data = this._data;
  value = utils.mergePriority(value, priority);
  var currentPath = [];
  path = path.slice();

  this._data = mergeValues(currentPath, path, data, value, listeners);

};/* */

function mergeValues(currentPath, remainingPath, oldValue, newValue, listeners){
  var newProp;
  if(remainingPath.length){

    var propName = remainingPath.shift();
    var propListeners = listeners && listeners[propName];
    var oldProp = (oldValue && oldValue.hasOwnProperty(propName)) ? oldValue[propName] : null;
    currentPath.push(propName);
    newProp = mergeValues(currentPath, remainingPath, oldProp, newValue, propListeners);
    currentPath.pop();
    if(oldProp === newProp){
      return oldValue;
    }

    var copy = {};
    for(var i in oldValue){
      if(oldValue.hasOwnProperty(i)){
        copy[i] = oldValue[i];
      }
    }
    /* jshint -W028 */
    // A labeled if statement. Yes it's a bit weird, but it works... and there are tests to prove it.
    loop: if(newProp === null){
      delete copy[propName];
      for(var j in copy){
        if(j !== '.priority'){
          break loop;
        }
      }
      copy = null;
    }
    else {
      copy[propName] = newProp;
    }
    var events = listeners && listeners['.events'];
    if(events){
      var pathString = currentPath.join('/');
      var childSnap = new FakeSnapshot(pathString + '/' + propName, newProp === null ? oldProp : newProp);
      var childEventType = newProp === null ? 'child_removed' : oldProp === null ? 'child_added' : 'child_changed';
      events.emit(childEventType,childSnap);
      events.emit('value', new FakeSnapshot(pathString,copy));
    }
    return copy;
  } else {
    newProp = callListeners(currentPath, newValue, oldValue, listeners);
    return utils.isEqualLeafValue(oldValue, newProp) ? oldValue : newProp;
  }
}

function callListeners(path, value, oldValue, listeners){
  var changed = !(value === oldValue || ((typeof value === 'object') && (typeof oldValue === 'object')));

  var keyCache = {};
  var i;

  var events = listeners && listeners['.events'];

  if(typeof value === 'object' && value !== null){
    for( i in value){
      if (value.hasOwnProperty(i) && i.charAt(0) !== '.'){
        keyCache[i] = true;
        path.push(i);

        var oldProp = oldValue && oldValue.hasOwnProperty(i) ? oldValue[i] : null;
        var newProp = value[i];
        var childChanged = (oldProp !== callListeners(
          path,
          newProp,
          oldProp,
          listeners && listeners[i]
        ));
        changed = childChanged || changed;


        if(events){
          if( !(oldValue && oldValue.hasOwnProperty(i))) {
            events.emit('child_added', new FakeSnapshot(path.join('/'), newProp));
          }
          else if(childChanged) {
            events.emit('child_changed', new FakeSnapshot(path.join('/'), newProp));
          }
        }

        path.pop();
      }
    }
    if(!changed && value.hasOwnProperty('.priority')){
      changed = !(oldValue && (value['.priority'] === oldValue['.priority']));
    }
    if(!changed && value.hasOwnProperty('.value')){
      changed = !(oldValue && (value['.value'] === oldValue['.value']));
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

        if(events){
          events.emit('child_removed', new FakeSnapshot(path.join('/'), oldValue[i]));
        }

        path.pop();
      }
    }
    if(!changed && oldValue.hasOwnProperty('.priority')){
      changed = !(value && (value['.priority'] === oldValue['.priority']));
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
    if(events){
      events.emit('value',new FakeSnapshot(path.join('/'),value));
    }
  }
  return changed ? value : oldValue;
}

FirebaseProxy.prototype.handleCallback = function(){
  throw new Error('handleCallback not implemented');
};


module.exports = FirebaseProxy;