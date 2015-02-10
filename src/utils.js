'use strict';

var _ = require('lodash');

function isInt(n){
  return /^-?\d+$/.test(n);
}

function comparePriorities (a, b) {
  if (a !== b) {
    if (a === null || b === null) {
      return a === null? -1 : 1;
    }
    if (typeof a !== typeof b) {
      return typeof a === 'number' ? -1 : 1;
    } else {
      return a > b ? 1 : -1;
    }
  }
  return 0;
}

function orderByKey(snap1, snap2) {
  var key1 = snap1.key();
  var key2 = snap2.key();

  var isN1 = isInt(key1);
  var isN2 = isInt(key2);
  if (isN1 || isN2) {
    if (isN1 && isN2) {
      key1 = parseInt(key1);
      key2 = parseInt(key2);
    }
    else if (isN1) {
      return -1;
    }
    else {
      return 1;
    }
  }

  if (key1 === key2) return 0;
  return key1 < key2 ? -1 : 1;
}

exports.orderByKeyComparator = orderByKey;

exports.orderByPriorityComparator = function(snap1, snap2){
  var comp = comparePriorities(snap1.getPriority(),snap2.getPriority());
  return comp === 0 ? orderByKey(snap1, snap2) : comp;
};

function rank(val){
  if(val === null) return 1;
  if(val === false) return 2;
  if(val === true) return 3;
  if(_.isNumber(val)) return 4;
  if(_.isString(val)) return 5;
  return 6;
}

exports.orderByChildComparator = function(child){
  return function(snap1,snap2){
    var val1 = snap1.child(child).val();
    var val2 = snap2.child(child).val();
    if(val1 === val2) return orderByKey(snap1, snap2);
    var rank1 = rank(val1);
    var rank2 = rank(val2);
    if(rank1 != rank2){
      return rank1 > rank2 ? 1 : -1;
    }
    if(rank1 === 6) return orderByKey(snap1, snap2);
    return val1 > val2 ? 1 : -1;
  };
};

function clone(val){
  return val === undefined ? null : JSON.parse(JSON.stringify(val));
}
exports.clone = clone;

function cloneWithPriority(val,pri){
  val = clone(val);
  if(val && val.hasOwnProperty('.priority')){
    pri = val['.priority'];
  }
  return mergePriority(val,pri);
}
exports.cloneWithPriority = cloneWithPriority;

function mergePriority(val,pri){
  if(val === null || !(pri || pri === 0 || pri === '')){
    pri = null;
  }
  if(pri !== null){
    if(!val || typeof val !== 'object'){
      val = {
        '.value':val
      };
    }
    val['.priority'] = pri;
  }
  return val;
}
exports.mergePriority = mergePriority;

function extractPriority(val){
  return (val && val.hasOwnProperty('.priority')) ? val['.priority'] : null;
}
exports.extractPriority = extractPriority;

function valueCopy(val){
  if(!val) return val === undefined ? null : val;
  if(val.hasOwnProperty('.value')){
    return val['.value'];
  }
  if(typeof val != 'object') return val;
  var copy = {};
  var child;
  var noValues = true;
  for(var i in val){
    if(val.hasOwnProperty(i)){
      child = valueCopy(val[i]);
      if(child !== null){
        noValues = false;
        copy[i] = valueCopy(child);
      }
    }
  }
  if(noValues){
    return null;
  }
  delete copy['.priority'];
  return copy;
}
exports.valueCopy = valueCopy;

var invalidPath = /[\.\][#$]/;
function validatePath(path){
  if(!path || typeof path != 'string' || path.length === 0 || invalidPath.test(path)){
    throw 'Paths must be non-empty strings and can\'t contain ".", "#", "$", "[", or "]"';
  }
}
exports.validatePath = validatePath;

function validateValue(val){
  if(typeof val == 'object'){
    for(var i in val){
      if(val.hasOwnProperty(i)){
        validatePath(i);
        validateValue(val[i]);
      }
    }
  }
}
exports.validateValue = validateValue;

function parseUri(uri){
  var spl = uri.split('/');
  var i = spl.length - 1;
  if(spl[i] === '') {
    i--;
    spl.pop();
    uri = spl.join('/');
  }
  if(i < 2) throw new Error(uri + ' not a valid uri.');
  if(i == 2) {
    return {
      uri:uri,
      parent:null,
      key:null
    };
  }
  var key = spl[i];
  spl.pop();
  return {
    uri: uri,
    parent: spl.join('/'),
    key: key
  };
}
exports.parseUri = parseUri;

function mergeCopy(orginalData, path, value){
  return _mergeCopy(orginalData, path.slice(), value === undefined ? null : value);
}

function isEqualLeafValue(a,b){
  return (a === b) ||
  (
  a && b &&
  a.hasOwnProperty('.value') && b.hasOwnProperty('.value') &&
  a.hasOwnProperty('.priority') && b.hasOwnProperty('.priority') &&
  a['.value'] === b['.value'] &&
  a['.priority'] === b['.priority']
  );
}

exports.isEqualLeafValue = isEqualLeafValue;

function _mergeCopy(originalData, path, value){
  if(path.length){
    var propName = path.shift();
    var originalProp = (originalData && originalData.hasOwnProperty(propName)) ? originalData[propName] :  null;
    var copyProp = _mergeCopy(originalProp, path, value);
    if(copyProp === originalProp) {
      return originalData;
    }
    return mergeProperty(shallowCopy(originalData),propName,copyProp);
  }
  else {
    return isEqualLeafValue(originalData,value) ? originalData : value;
  }
}
exports.mergeCopy = mergeCopy;

/**
 * If propValue is non-null, sets obj[propName] = propValue, and returns obj.
 *
 * If propValue is null, deletes obj[propName]. Returns obj, or null if obj has no further properties.
 *
 * @param {Object} obj
 * @param {String} propName
 * @param propValue
 * @returns {Object, null}
 */
function mergeProperty(obj, propName, propValue){
  if(propValue === null){
    delete obj[propName];
    for(var j in obj){
      if(j !== '.priority'){
        return obj;
      }
    }
    return null;
  }
  else {
    obj[propName] = propValue;
    return obj;
  }
}
exports.mergeProperty = mergeProperty;


/**
 * Creates a shallow copy of an object.
 * @param {Object} obj
 * @returns {Object}
 */
function shallowCopy(obj){
  var copy = {};
  for(var i in obj){
    /* istanbul ignore else */
    if(obj.hasOwnProperty(i)){
      copy[i] = obj[i];
    }
  }
  return copy;
}
exports.shallowCopy = shallowCopy;