var Firebase = require('firebase');

function Entry(ref){
  //var events = new EventEmitter;
  var _value;
  var key = ref.key();
  var ordered = ref.limit(1);

  function firstChild(val){
    if(val === null) return null;
    var keys = Object.keys(val);
    if(keys.length === 0) return null;
    return val[keys[0]];
  }

  function onChildAdded (snap) {
    var entry = firstChild(snap.val());
    _value = entry ? entry.value : null;
    //events.emit('value',_value);
  }

  function setValue(val){
    ref.push().setWithPriority({value:val},Firebase.ServerValue.TIMESTAMP);
  }

  function getValue(){
    return _value;
  }

  this.key = key;
  this.ref = ref;

  ordered.on('value', onChildAdded);

  this.set = setValue;
  this.get = getValue;
}

module.exports = Entry;