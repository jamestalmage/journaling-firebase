
var Emitter = require('../src/EventEmitter.js');
var expect = require('chai').expect;

function Custom() {
  Emitter.call(this);
}

Custom.prototype = Emitter.prototype;

describe('Custom', function(){
  describe('with Emitter.call(this)', function(){
    it('should work', function(done){
      var emitter = new Custom();
      emitter.on('foo', done);
      emitter.emit('foo');
    });
  });
});

describe('Emitter', function(){
  describe('.on(event, fn)', function(){
    it('should add listeners', function(){
      var emitter = new Emitter();
      var calls = [];

      emitter.on('foo', function(val){
        calls.push('one', val);
      });

      emitter.on('foo', function(val){
        calls.push('two', val);
      });

      emitter.emit('foo', 1);
      emitter.emit('bar', 1);
      emitter.emit('foo', 2);

      expect(calls).to.eql([ 'one', 1, 'two', 1, 'one', 2, 'two', 2 ]);
    });
  });

  describe('.on(event, fn, cancel', function(){
    it('should add cancel listener', function(){
      var emitter = new Emitter();
      var calls = [];

      emitter.on('foo', function(val){
        calls.push('call', val);
      }, function(val){
        calls.push('cancel', val);
      });

      emitter.emit('foo', 1);
      emitter.emit('foo', 2);
      emitter.cancel('foo', 3);
      emitter.emit('foo', 3);

      expect(calls).to.eql([ 'call', 1, 'call', 2, 'cancel', 3 ]);
    });
  });

  describe('.on(event, fn, context', function(){
    it('should add cancel listener', function(){
      var emitter = new Emitter();
      var calls = [];
      var one = {ctx:'one'}, two = {ctx:'two'};

      emitter.on('foo', function(val){
        calls.push('one', val, this);
      }, one);

      emitter.on('foo', function(val){
        calls.push('two', val, this);
      }, two);



      emitter.emit('foo', 1);
      emitter.emit('foo', 2);

      expect(calls).to.eql([ 'one', 1, {ctx:'one'},'two', 1, {ctx:'two'}, 'one', 2, {ctx:'one'},'two', 2, {ctx:'two'},  ]);
    });
  });

  describe('.once(event, fn)', function(){
    it('should add a single-shot listener', function(){
      var emitter = new Emitter();
      var calls = [];

      emitter.once('foo', function(val){
        calls.push('one', val);
      });

      emitter.emit('foo', 1);
      emitter.emit('foo', 2);
      emitter.emit('foo', 3);
      emitter.emit('bar', 1);

      expect(calls).to.eql([ 'one', 1 ]);
    });
  });

  describe('.once(event, fn, cancel)', function(){
    it('should add a single-shot listener', function(){
      var emitter = new Emitter();
      var calls = [];

      emitter.once('foo', function(val){
        calls.push('one', val);
      },function (val){
        calls.push('cancel one', val);
      });

      emitter.once('bar', function(val){
        calls.push('two', val);
      },function (val){
        calls.push('cancel two', val);
      });

      emitter.emit('foo', 1);
      emitter.cancel('bar', 2);
      emitter.emit('foo', 3);
      emitter.emit('bar', 4);

      expect(calls).to.eql([ 'one', 1 , 'cancel two', 2]);
    });
  });

  describe('.once(event, fn, ctx)', function(){
    it('should add a single-shot listener', function(){
      var emitter = new Emitter();
      var calls = [];
      var one = {ctx:'one'}, two = {ctx:'two'};


      emitter.once('foo', function(val){
        calls.push('one', val, this);
      }, one);

      emitter.emit('foo', 1);
      emitter.cancel('bar', 2);
      emitter.emit('foo', 3);
      emitter.emit('foo', 4);

      expect(calls).to.eql([ 'one', 1, one ]);
    });
  });

  describe('.once(event, fn, cancel, ctx)', function(){
    it('should add a single-shot listener', function(){
      var emitter = new Emitter();
      var calls = [];
      var one = {ctx:'one'}, two = {ctx:'two'};


      emitter.once('foo', function(val){
        calls.push('one', val, this);
      },function (val){
        calls.push('cancel one', val, this);
      }, one);

      emitter.once('bar', function(val){
        calls.push('two', val, this);
      },function (val){
        calls.push('cancel two', val, this);
      }, two);

      emitter.emit('foo', 1);
      emitter.cancel('bar', 2);
      emitter.emit('foo', 3);
      emitter.emit('bar', 4);

      expect(calls).to.eql([ 'one', 1, one , 'cancel two', 2, two]);
    });
  });

  describe('.off(event, fn)', function(){
    it('should remove a listener', function(){
      var emitter = new Emitter();
      var calls = [];

      function one() { calls.push('one'); }
      function two() { calls.push('two'); }

      emitter.on('foo', one);
      emitter.on('foo', two);
      emitter.off('foo', two);

      emitter.emit('foo');

      expect(calls).to.eql([ 'one' ]);
    });

    it('should work with .once()', function(){
      var emitter = new Emitter();
      var calls = [];

      function one() { calls.push('one'); }

      emitter.once('foo', one);
      emitter.once('fee', one);
      emitter.off('foo', one);

      emitter.emit('foo');

      expect(calls).to.eql([]);
    });

    it('should work when called from an event', function(){
      var emitter = new Emitter();
      var called = false;
      function b () {
        called = true;
      }
      emitter.on('tobi', function () {
        emitter.off('tobi', b);
      });
      emitter.on('tobi', b);
      emitter.emit('tobi');
      expect(called).to.be.true;
      called = false;
      emitter.emit('tobi');
      expect(called).to.be.false;
    });
  });

  describe('.cancel(event)', function(){
    it('should remove all listeners', function(){
      var emitter = new Emitter();
      var calls = [];

      function one() { calls.push('one'); }
      function two() { calls.push('two'); }

      emitter.on('foo', one);
      emitter.on('foo', two);
      emitter.cancel('foo');

      emitter.emit('foo');

      expect(calls).to.eql([]);
    });

    it('should work when called from an event', function(){
      var emitter = new Emitter();
      var called = false;
      function b () {
        called = true;
      }
      emitter.on('tobi', function () {
        emitter.cancel('tobi');
      });
      emitter.on('tobi', b);
      emitter.emit('tobi');
      expect(called).to.be.true;
      called = false;
      emitter.emit('tobi');
      expect(called).to.be.false;
    });

    it('should call cancel functions when called from an event', function(){
      var emitter = new Emitter();
      var calls = [];
      function cb () {
        calls.push('called');
      }
      function cancelCb () {
        calls.push('cancelled');
      }
      emitter.on('tobi', cb, cancelCb);
      emitter.on('tobi', function () {
        emitter.cancel('tobi');
      });
      //emitter.on('tobi', cb, cancelCb);    //TODO: It should work if the cancel callback comes second.
      emitter.emit('tobi');
      emitter.emit('tobi');
      expect(calls).to.eql(['called','cancelled']);
    });
  });

  describe('.cancel()', function(){
    it('should remove all listeners', function(){
      var emitter = new Emitter();
      var calls = [];
      function callA(){
        calls.push('callA');
      }
      function callB(){
        calls.push('callB');
      }
      function cancelA(){
        calls.push('cancelA');
      }
      function cancelB(){
        calls.push('cancelB');
      }
      emitter.on('a', callA, cancelA);
      emitter.on('b', callB, cancelB);
      emitter.emit('a');
      emitter.emit('b');
      emitter.cancel();
      emitter.emit('a');
      emitter.emit('b');
      expect(calls).to.eql(['callA','callB','cancelA','cancelB']);
    });

    it('should work if there are no listeners', function(){
      (new Emitter()).cancel();
    });
  });

  describe('.off(event, fn, ctx)', function(){
    it('should remove a listener', function(){
      var emitter = new Emitter();
      var calls = [];
      var one = {ctx:1};
      var two = {ctx:2};

      function cb() { calls.push('one', this); }

      emitter.on('foo', cb, one);
      emitter.on('foo', cb, two);
      emitter.off('foo', cb, two);

      emitter.emit('foo');

      expect(calls).to.eql([ 'one', {ctx:1} ]);
    });

    it('should work with .once()', function(){
      var emitter = new Emitter();
      var calls = [];
      var one = {ctx:1};
      var two = {ctx:2};

      function cb() { calls.push('one', this); }

      emitter.once('foo', cb, one);
      emitter.once('foo', cb, two);
      emitter.off('foo', cb, two);

      emitter.emit('foo');

      expect(calls).to.eql(['one', {ctx:1}]);
    });

    it('should work when called from an event', function(){
      var emitter = new Emitter();
      var ctxA = {};
      var ctxB = {};
      function cb () {
        this.called = true;
      }
      emitter.on('tobi', function () {
        emitter.off('tobi', cb, ctxA);
      });
      emitter.on('tobi', cb, ctxA);
      emitter.on('tobi', cb, ctxB);
      emitter.emit('tobi');
      expect(ctxA.called).to.be.true;
      expect(ctxB.called).to.be.true;
      ctxA.called = ctxB.called = false;
      emitter.emit('tobi');
      expect(ctxA.called).to.be.false;
      expect(ctxB.called).to.be.true;
    });
  });

  describe('.off(event)', function(){
    it('should remove all listeners for an event', function(){
      var emitter = new Emitter();
      var calls = [];

      function one() { calls.push('one'); }
      function two() { calls.push('two'); }

      emitter.on('foo', one);
      emitter.on('foo', two);
      emitter.off('foo');

      emitter.emit('foo');
      emitter.emit('foo');

      expect(calls).to.eql([]);
    });

    it('should do nothing if no listenrs are registered',function(){
      new Emitter().off('foo');
    });
  });

  describe('.off()', function(){
    it('should remove all listeners', function(){
      var emitter = new Emitter();
      var calls = [];

      function one() { calls.push('one'); }
      function two() { calls.push('two'); }

      emitter.on('foo', one);
      emitter.on('bar', two);

      emitter.emit('foo');
      emitter.emit('bar');

      emitter.off();

      emitter.emit('foo');
      emitter.emit('bar');

      expect(calls).to.eql(['one', 'two']);
    });

    it('should do nothing if no listenrs are registered',function(){
      new Emitter().off();
    });
  });

  describe('.listeners(event)', function(){
    describe('when handlers are present', function(){
      it('should return an array of callbacks', function(){
        var emitter = new Emitter();
        function foo(){}
        emitter.on('foo', foo);
        expect(emitter.listeners('foo')).to.eql([foo]);
      });
    });

    describe('when no handlers are present', function(){
      it('should return an empty array', function(){
        var emitter = new Emitter();
        expect(emitter.listeners('foo')).to.eql([]);
      });
    });
  });

  describe('.hasListeners(event)', function(){
    describe('when handlers are present', function(){
      it('should return true', function(){
        var emitter = new Emitter();
        emitter.on('foo', function(){});
        expect(emitter.hasListeners('foo')).to.be.true;
        expect(emitter.hasListeners()).to.be.true;
      });
    });

    describe('when no handlers are present', function(){
      it('should return false if no listeners have been added', function(){
        var emitter = new Emitter();
        expect(emitter.hasListeners('foo')).to.be.false;
        expect(emitter.hasListeners()).to.be.false;
      });

      it('should return false if no listeners have been added for the given eventType', function(){
        var emitter = new Emitter();
        emitter.on('bar', function(){});
        expect(emitter.hasListeners('foo')).to.be.false;
      });

      it('should return false if all listeners have been removed for the given eventType', function(){
        var emitter = new Emitter();
        function bar(){}
        emitter.on('foo', bar);
        emitter.off('foo',bar);
        expect(emitter.hasListeners('foo')).to.be.false;
        expect(emitter.hasListeners()).to.be.false;
      });
    });
  });
});

describe('Emitter(obj)', function(){
  it('should mixin', function(done){
    var proto = {};
    Emitter(proto);
    proto.on('something', done);
    proto.emit('something');
  });
});