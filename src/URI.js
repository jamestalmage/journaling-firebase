function URI(uri,safeCopy){
  safeCopy = safeCopy !== false;
  uri = trim(safeCopy ? makeArray(uri,true) : uri);
  this.protocol = uri[0];
  this.host = uri[2];
  this.uri = uri.join('/');
  var len = uri.length;
  this.key = len < 4 ? null : uri[ len - 1 ];
  this._arr = uri;
}

URI.prototype.__defineGetter__('parent',function(){
  var arr = this._arr, len = arr.length;
  return len < 4 ? null : new URI(arr.slice(0,-1),false);
});

URI.prototype.toString = function(){
  return this.uri;
};

URI.prototype.child = function(path){
  return new URI(this._arr.concat(makeArray(path,false)),false);
};

URI.prototype.isChild = function(child){
  return isChild(this.uri,makeString(child));
};

URI.prototype.isParent = function(parent){
  return isChild(makeString(parent),this.uri);
};

module.exports = URI;

function trim(uri){
  if(uri.length && uri[uri.length - 1] === '') {
    uri.pop();
  }
  return uri;
}

function makeArray(path, safeCopy){
  if(Array.isArray(path)){
    return safeCopy ? path.slice() : path;
  } else if(typeof path === 'string') {
    return path.split('/');
  } else if(path instanceof URI){
    return path._arr;
  }
  throw new Error(path + ' not a valid path object');
}


function makeString(path){
  //WARNING: does not trim trailing '/';
  if(typeof path === 'string'){
    return path;
  }
  if(Array.isArray(path)){
    return path.join('/');
  }
  if(path instanceof URI){
    return path.uri;
  }
  throw new Error(path + ' not a valid path object');
}

function isChild(parent, child){
  var parentLength = parent.length;
  if(parent.charAt(parentLength - 1) == '/') {
    parentLength--;
  }
  return (child.length > parentLength + 1) && (child.charAt(parentLength) == '/') && (child.lastIndexOf(parent,0) === 0);
}