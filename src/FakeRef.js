var URI = require('./URI');

function FakeRef (path){
  this._uri = new URI(path);
}

FakeRef.prototype.key = function(){
  return this._uri.key;
};

FakeRef.prototype.child = function(path){
  return new FakeRef(this._uri.child(path));
};

module.exports = FakeRef;