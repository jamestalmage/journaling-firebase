module.exports = makeSnapshot;

var utils = require('./utils');
var ObjectSnapshot = require('./ObjectSnapshot');
var LeafSnapshot = require('./LeafSnapshot');

function makeSnapshot(ref, _value, _priority){
  var value = getValue(_value);
  var priority = getPriority(_value, _priority);
  if(typeof value === 'object' && value !== null){
    var children = [];
    for(var i in value){
      if(value.hasOwnProperty(i) && i.charAt(0) !== '.'){
        var child = makeSnapshot(ref.child(i), value[i]);
        if(child.exists()){
          children.push(child);
        }
      }
    }
    children.sort(utils.orderByPriorityComparator);
    return new ObjectSnapshot(ref, children, priority);
  } else {
    return new LeafSnapshot(ref, value, priority);
  }
}

//TODO: move to utils
function getPriority(value, priority){
  if(getValue(value) === null) return null;
  if(typeof value === 'object' && value.hasOwnProperty('.priority')){
    priority = value['.priority'];
  }
  if(priority === undefined) return null;
  return priority;
}

//TODO: move to utils
function getValue(value){
  if(value === null || value === undefined) return null;
  if(typeof value === 'object' && value.hasOwnProperty('.value')){
    return getValue(value['.value']);
  }
  return value;
}


