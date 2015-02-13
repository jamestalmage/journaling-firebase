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
  path = path.slice();
  var pathStr = path.join('/');
  var wrapper = this._wrapper;
  var listeners = this._listeners;
  var listenersStack = [];
  var data = this._data;
  var initialized = listeners['.initialized'];
  var listening = listeners['.events'];

  for(var i = 0, len = path.length; i < len; i++){
    listenersStack.push(listeners);
    var propName = path[i];
    listeners = listeners[propName] || (listeners[propName] = {});
    initialized = initialized || listeners['.initialized'];
    listening = listening || listeners['.events'];
    data = safelyGetProperty(data,propName);
  }

  var events = listeners['.events'];

  if(!events){
    events = listeners['.events'] = new EventEmitter();
    if(!listening){
      var childWatchers = findChildWatchers(path, listeners);
      wrapper.startWatching(pathStr, childWatchers, findCommonParent(path,listenersStack,false).join('/') || null);
    }
  }
  events.on(eventType,callback);

  if(initialized){
    callback(new FakeSnapshot(pathStr,data));
  }
};

FirebaseProxy.prototype.off = function(path, eventType, callback, cancelCallback, context){
  path = path.slice();
  var listeners = this._listeners;
  var listening = listeners['.events'];
  var listenersStack = [];
  var propName;

  for(var i = 0, len = path.length; i < len; i++){
    listenersStack.push(listeners);
    propName = path[i];
    listeners = listeners[propName];
    if(!listeners){
      return;
    }
    listening = listening || listeners['.events'];
  }

  var events = listeners['.events'];

  if(events){
    events.off(eventType,callback);
    if(!events.hasListeners()){
      delete listeners['.events'];
      if(listening === events){
        var unwatchPath = path.join('/');
        var childWatchPaths = findChildWatchers(path, listeners);
        var deleting = !childWatchPaths.length;
        var commonParents = findCommonParent(path,listenersStack, deleting);
        this._wrapper.stopWatching(unwatchPath, childWatchPaths, commonParents.join('/'));
        if(deleting){
          this._prune(commonParents, path[commonParents.length]);
        }
      }
    }
  }
};

FirebaseProxy.prototype._prune = function(prunePath, pruneProp){
  var listeners = this._listeners;
  for(var i = 0, len = prunePath.length; i < len; i++){
    listeners = listeners && listeners[prunePath[i]];
    if(listeners && listeners['.disablePruning']){
      return;
    }
  }
  var data = this._getData(prunePath);
  delete data[pruneProp];
};

FirebaseProxy.prototype._getData = function(path){
  var data = this._data;
  for (var i = 0, len = path.length; i < len; i++) {
    data = safelyGetProperty(data,path[i]);
  }
  return data;
};

FirebaseProxy.prototype.on_value = function(path, value, priority, disablePruning){
  var listeners = this._listeners;
  var data = this._data;
  value = utils.mergePriority(value, priority);
  var currentPath = [];
  path = path.slice();

  this._data = mergeValues(currentPath, path, data, value, listeners, disablePruning, false);
};

function mergeValues(currentPath, remainingPath, oldValue, newValue, listeners, disablePruning, listening, initialized){
  if(!listeners && !listening) return oldValue;
  listening = listening || (listeners && listeners['.events']);
  initialized = initialized || (listeners && listeners['.initialized']);
  var newProp;
  if(remainingPath.length){
    var nextToLast = remainingPath.length === 1;

    var propName = remainingPath.shift();
    var propListeners = listeners && listeners[propName];
    var oldProp = safelyGetProperty(oldValue,propName);

    currentPath.push(propName);
    newProp = mergeValues(currentPath, remainingPath, oldProp, newValue, propListeners, disablePruning, listening);
    currentPath.pop();

    if(oldProp === newProp){
      return oldValue;
    }

    var copy = utils.mergeProperty(utils.shallowCopy(oldValue),propName,newProp);

    var events = listeners && listeners['.events'];
    if(events){
      var propInitialized = initialized || nextToLast || (propListeners && propListeners['.initialized']);
      var pathString = currentPath.join('/');
      if(propInitialized) emitChildEvent(events, pathString + '/' + propName, newProp, oldProp);
      if(initialized) events.emit('value', new FakeSnapshot(pathString,copy));
    }
    return copy;
  } else {
    if(listeners && disablePruning){
      listeners['.disablePruning'] = true;
    }
    newProp = callListeners(currentPath, newValue, oldValue, listeners);
    return utils.isEqualLeafValue(oldValue, newProp) ? oldValue : newProp;
  }
}

function callListeners(path, value, oldValue, listeners){
  var changed = !(value === oldValue || ((typeof value === 'object') && (typeof oldValue === 'object')));

  var keyCache = {};

  var events = listeners && listeners['.events'];

  changed = iterateNewAndChanged(value, oldValue, path, listeners, keyCache, changed);
  changed = iterateRemoved(value, oldValue, path, listeners, keyCache, changed);

  if(listeners){
    for(var i in listeners){
      if(!keyCache[i] && hasOwnPublicProperty(listeners,i)){
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

function iterateNewAndChanged(value, oldValue, path, listeners, keyCache, changed) {
  var events = listeners && listeners['.events'];
  if (typeof value === 'object' && value !== null) {
    for (var i in value) {
      if (hasOwnPublicProperty(value, i)) {
        keyCache[i] = true;

        var oldProp = safelyGetProperty(oldValue, i);
        var newProp = value[i];

        path.push(i);

        var childChanged = (oldProp !== callListeners(
          path,
          newProp,
          oldProp,
          listeners && listeners[i]
        ));
        changed = childChanged || changed;


        if (events && childChanged) {
          var snap = new FakeSnapshot(path.join('/'),newProp);
          var eventType = oldValue && oldValue.hasOwnProperty(i) ? 'child_changed' : 'child_added';
          events.emit(eventType,snap);
        }

        path.pop();
      }
    }
    if (!changed && value.hasOwnProperty('.priority')) {
      changed = !(oldValue && (value['.priority'] === oldValue['.priority']));
    }
    if (!changed && value.hasOwnProperty('.value')) {
      changed = !(oldValue && (value['.value'] === oldValue['.value']));
    }
  }
  return changed;
}

function iterateRemoved(value, oldValue, path, listeners, keyCache, changed) {
  var events = listeners && listeners['.events'];
  if (typeof oldValue === 'object' && oldValue !== null) {
    for (var i in oldValue) {
      if (!keyCache[i] && hasOwnPublicProperty(oldValue, i)) {
        keyCache[i] = true;
        changed = true;

        path.push(i);

        callListeners(
          path,
          null, // we know the new value does not have this property
          oldValue[i],
          listeners && listeners[i]
        );

        if (events) {
          events.emit('child_removed', new FakeSnapshot(path.join('/'), oldValue[i]));
        }

        path.pop();
      }
    }
    if (!changed && oldValue.hasOwnProperty('.priority')) {
      changed = !(value && (value['.priority'] === oldValue['.priority']));
    }
  }
  return changed;
}

module.exports = FirebaseProxy;

/**
 * Safely gets the property with the given name from an object or primitive.
 * Return null if objOrPrimitive is null, a primitive, or does not have the specified property,
 * otherwise return the property value.
 * @param {Object,null,string,number,boolean} objOrPrimitive
 * @param propName
 * @returns {Object, null}
 */
function safelyGetProperty(objOrPrimitive,propName){
  return (objOrPrimitive && objOrPrimitive.hasOwnProperty(propName)) ? objOrPrimitive[propName] : null;
}

/**
 * Checks to see if node has any children (i.e. properties). It excludes properties that start with '.',
 * as well as an optional single excluded name `otherThan`
 * @param {Object} node possibly containing children.
 * @param {String} [otherThan] property name to exclude from the check.
 * @returns {boolean} true if node contains any children other than the excluded property name.
 */
function hasChildren(node,otherThan){
  for(var i in node){
    if(hasOwnPublicProperty(node,i) && otherThan !== i){
      return true;
    }
  }
  return false;
}

/**
 *
 * @param {String[]} pathStack A string array containing the path. Should match the listenersStack.
 * @param {Object[]} listenersStack A stack of listener nodes, built by pushing each listener node as
 * you iterate down the path. Should match the listenersStack.
 * @param {boolean} deleting if truthy, the stack represent an empty branch that should be deleted until a branching
 * ancestor is found.
 * @returns {Array|*|Array.<T>|string|Blob}
 */
function findCommonParent(pathStack, listenersStack, deleting){
  pathStack = pathStack.slice();
  while(true){
    var propName = pathStack.pop();
    var listeners = listenersStack.pop();
    if(deleting){
      delete listeners[propName];
      propName = null;
    }
    if(!pathStack.length || hasChildren(listeners,propName)){
      return pathStack;
    }
  }
}

/**
 * Generates an array with child paths that contain listeners. It is not a comprehensive list
 * The once listeners are found on a given branch, the algorithm does not search any deeper.
 * (i.e. the return value would not contain both 'a/b' and 'a/b/c', since it would stop looking at 'b').
 *
 * @param {String[]} path An array of strings representation the path (i.e. pathString.split('/')).
 * @param {Object} listenersNode
 * @returns {String[]} An array
 */
function findChildWatchers(path, listenersNode){
  var childPaths = [];
  _findChildWatchers(path,listenersNode,childPaths,false);
  return childPaths;
}

function _findChildWatchers(path, listenersNode, childPaths, include){
  if(include && listenersNode['.events']){
    childPaths.push(path.join('/'));
    return;
  }
  for(var i in listenersNode){
    if(hasOwnPublicProperty(listenersNode, i)){
      path.push(i);
      _findChildWatchers(path, listenersNode[i], childPaths, true);
      path.pop();
    }
  }
}

/**
 * Similar to obj.hasOwnProperty, but also checks to make sure the propName doesn't start with '.'
 * @param obj
 * @param propName
 * @returns {*|boolean}
 */
function hasOwnPublicProperty(obj, propName) {
  return obj.hasOwnProperty(propName) && propName.charAt(0) !== '.';
}

/**
 * Will correctly create a snapshot for, and call one of the child related events.
 * TODO: does not handle child_moved
 * @param {EventEmitter}events
 * @param {String} path
 * @param {*} newProp
 * @param {*} oldProp
 */
function emitChildEvent(events, path, newProp, oldProp) {
  var childSnap = new FakeSnapshot(path, newProp === null ? oldProp : newProp);
  var childEventType = newProp === null ? 'child_removed' : oldProp === null ? 'child_added' : 'child_changed';
  events.emit(childEventType, childSnap);
}