'use strict';
module.exports = FlushQueue;




function FlushQueue(){
  this._head = null;
  this._tail = null;
}

FlushQueue.prototype.flush = function(){
  var head = this._head;
  while(head){
    var temp = head._right;
    head._right = null;
    head._left = null;
    head._call();
    head = temp;
  }
  this._head = this._tail = null;
};

FlushQueue.prototype._schedule = function(registration){
  if(this._head === null){
    this._head = this._tail = registration;
  }
  else {
    var oldTail = this._tail;
    registration._left = oldTail;
    oldTail._right = registration;
    this._tail = registration;
  }
};

FlushQueue.prototype._cancel = function(registration){
  var right = registration._right;
  var left = registration._left;
  if(left === null){
    this._head = right;
    registration._right = null;
    if(right) right._left = null;
    return;
  }
  if(right === null){
    this._tail = left;
    registration._left = null;
    left._right = null;
    return;
  }
  left._right = right;
  right._left = left;
  registration._left = registration._right = null;
};

FlushQueue.prototype.registration = function(ctx, cb){
  return new Registration(this, ctx, cb);
};

FlushQueue.prototype.childRegistration = function(ctx, cb){
  return new ChildRegistration(this, ctx, cb);
};

FlushQueue.prototype.clear = function(){
  var head = this._head;
  while(head){
    var temp = head._right;
    head._right = null;
    head._left = null;
    head._scheduled = false;
    head = temp;
  }
  this._head = this._tail = null;
};




function Registration(queue, ctx, cb){
  if(arguments.length === 0) return;
  this._queue = queue;
  this._ctx = ctx;
  this._cb = cb;
  this._scheduled = false;
  this._isString = isStringRegistrationArgs(ctx, cb);
  this._left = null;
  this._right = null;
}

Registration.prototype.schedule = function(){
  if(!this._scheduled){
    this._scheduled = true;
    this._queue._schedule(this);
  }
};

Registration.prototype.cancel = function(){
  if(this._scheduled){
    this._scheduled = false;
    this._queue._cancel(this);
  }
};

Registration.prototype._call = function(){
  this._scheduled = false;
  if(this._isString){
    this._ctx[this._cb]();
  }
  else {
    this._cb.call(this._ctx);
  }
};





function ChildRegistration(queue, ctx, cb){
  Registration.call(this, queue, ctx, cb);
  this._childQueue = new FlushQueue();
  this._explicityScheduled = false;
}

ChildRegistration.prototype = new Registration();

ChildRegistration.prototype._call = function(){
  this._explicityScheduled = false;
  this._childQueue.flush();
  Registration.prototype._call.call(this);
};

ChildRegistration.prototype.schedule = function(){
  this._explicityScheduled = true;
  Registration.prototype.schedule.call(this);
};

ChildRegistration.prototype.cancel = function(){
  this._explicityScheduled = false;
  this._conditionalCancel();
};

ChildRegistration.prototype._schedule = function(registration){
  this._childQueue._schedule(registration);
  Registration.prototype.schedule.call(this);
};

ChildRegistration.prototype.registration = function(ctx, cb){
  return new Registration(this, ctx, cb);
};

ChildRegistration.prototype.childRegistration = function(ctx, cb){
  return new ChildRegistration(this, ctx, cb);
};

ChildRegistration.prototype._cancel = function(registration){
  this._childQueue._cancel(registration);
  this._conditionalCancel();
};

ChildRegistration.prototype._conditionalCancel = function(){
  if(!(this._explicityScheduled || this._childQueue._head)){
    Registration.prototype.cancel.call(this);
  }
};

ChildRegistration.prototype.clear = function(force){
  this._childQueue.clear();
  if(force){
    this._explicityScheduled = false;
    Registration.prototype.cancel.call(this);
  } else {
    this._conditionalCancel();
  }
};





function isStringRegistrationArgs(ctx, cb){
  if(typeof cb !== 'function'){
    //assume string
    if(typeof ctx[cb] !== 'function'){
      throw new Error('could not find callback ' + cb + ' on ' + ctx);
    }
    return true;
  }
  return false;
}