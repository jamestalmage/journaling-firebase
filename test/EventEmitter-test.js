
var Emitter = require('../src/EventEmitter.js');
var expect = require('chai').expect;

function Custom() {
  Emitter.call(this)
}

Custom.prototype.__proto__ = Emitter.prototype;

describe('Custom', function(){
  describe('with Emitter.call(this)', function(){
    it('should work', function(done){
      var emitter = new Custom;
      emitter.on('foo', done);
      emitter.emit('foo');
    })
  })
})

describe('Emitter', function(){
  describe('.on(event, fn)', function(){
    it('should add listeners', function(){
      var emitter = new Emitter;
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
    })
  })

  describe('.on(event, fn, cancel', function(){
    it('should add cancel listener', function(){
      var emitter = new Emitter;
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
    })
  });

  describe('.once(event, fn)', function(){
    it('should add a single-shot listener', function(){
      var emitter = new Emitter;
      var calls = [];

      emitter.once('foo', function(val){
        calls.push('one', val);
      });

      emitter.emit('foo', 1);
      emitter.emit('foo', 2);
      emitter.emit('foo', 3);
      emitter.emit('bar', 1);

      expect(calls).to.eql([ 'one', 1 ]);
    })
  })

  describe('.off(event, fn)', function(){
    it('should remove a listener', function(){
      var emitter = new Emitter;
      var calls = [];

      function one() { calls.push('one'); }
      function two() { calls.push('two'); }

      emitter.on('foo', one);
      emitter.on('foo', two);
      emitter.off('foo', two);

      emitter.emit('foo');

      expect(calls).to.eql([ 'one' ]);
    })

    it('should work with .once()', function(){
      var emitter = new Emitter;
      var calls = [];

      function one() { calls.push('one'); }

      emitter.once('foo', one);
      emitter.once('fee', one);
      emitter.off('foo', one);

      emitter.emit('foo');

      expect(calls).to.eql([]);
    })

    it('should work when called from an event', function(){
      var emitter = new Emitter
        , called
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
  })

  describe('.off(event)', function(){
    it('should remove all listeners for an event', function(){
      var emitter = new Emitter;
      var calls = [];

      function one() { calls.push('one'); }
      function two() { calls.push('two'); }

      emitter.on('foo', one);
      emitter.on('foo', two);
      emitter.off('foo');

      emitter.emit('foo');
      emitter.emit('foo');

      expect(calls).to.eql([]);
    })
  })

  describe('.off()', function(){
    it('should remove all listeners', function(){
      var emitter = new Emitter;
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
    })
  })

  describe('.listeners(event)', function(){
    describe('when handlers are present', function(){
      it('should return an array of callbacks', function(){
        var emitter = new Emitter;
        function foo(){}
        emitter.on('foo', foo);
        expect(emitter.listeners('foo')).to.eql([foo]);
      })
    })

    describe('when no handlers are present', function(){
      it('should return an empty array', function(){
        var emitter = new Emitter;
        expect(emitter.listeners('foo')).to.eql([]);
      })
    })
  })

  describe('.hasListeners(event)', function(){
    describe('when handlers are present', function(){
      it('should return true', function(){
        var emitter = new Emitter;
        emitter.on('foo', function(){});
        expect(emitter.hasListeners('foo')).to.be.true;
      })
    })

    describe('when no handlers are present', function(){
      it('should return false', function(){
        var emitter = new Emitter;
        expect(emitter.hasListeners('foo')).to.be.false;
      })
    })
  })
})

describe('Emitter(obj)', function(){
  it('should mixin', function(done){
    var proto = {};
    Emitter(proto);
    proto.on('something', done);
    proto.emit('something');
  })
})