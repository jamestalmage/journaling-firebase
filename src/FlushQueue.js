'use strict';
module.exports = FlushQueue;




function FlushQueue(){
  this._queue = [];
}

FlushQueue.prototype.flush = function(){
  var queue = this._queue;
  this._queue = [];
  queue.forEach(function(registration){
    registration._call();
  });
};

FlushQueue.prototype._schedule = function(registration){
  this._queue.push(registration);
};

FlushQueue.prototype._cancel = function(registration){
  this._queue.splice(this._queue.indexOf(registration),1);
};

FlushQueue.prototype.registration = function(ctx, cb){
  return new Registration(this, ctx, cb);
};

FlushQueue.prototype.childRegistration = function(ctx, cb){
  return new ChildRegistration(this, ctx, cb);
};

FlushQueue.prototype.clear = function(){
  this._queue = [];
};




function Registration(queue, ctx, cb){
  if(arguments.length === 0) return;
  this._queue = queue;
  this._ctx = ctx;
  this._cb = cb;
  this._scheduled = false;
  this._isString = isStringRegistrationArgs(ctx, cb);
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
  if(!(this._explicityScheduled || this._childQueue._queue.length)){
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