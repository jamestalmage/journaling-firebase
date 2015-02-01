describe('FakeSnapshot',function() {
  'use strict';

  var chai = require('chai');
  var expect = chai.expect;
  var rewire = require('rewire');
  var sinon = require('sinon');
  chai.use(require('sinon-chai'));

  var FakeSnapshot = rewire('../src/FakeSnapshot');

  describe('#val()',function(){
    it('returns the boolean value passed to constructor', function(){
      var snap = new FakeSnapshot(true);
      expect(snap.val()).to.equal(true);
    });

    it('returns the number value passed to constructor', function(){
      var snap = new FakeSnapshot(3);
      expect(snap.val()).to.equal(3);
    });

    it('returns the string value passed to constructor', function(){
      var snap = new FakeSnapshot('hello');
      expect(snap.val()).to.equal('hello');
    });

    it('returns an object deep equal to what was passed to constructor', function(){
      var snap = new FakeSnapshot({a:'a',b:'b'});
      expect(snap.val()).to.eql({a:'a',b:'b'});
    });

    it('returns a new copy of the object for each call', function(){
      var val = {a:'a',b:'b'};
      var snap = new FakeSnapshot(val);
      expect(snap.val()).not.to.equal(val);
    });

    it('returns null if constructor is passed null or undefined', function(){
      var snap = new FakeSnapshot(null);
      expect(snap.val()).to.equal(null);
      var snap = new FakeSnapshot(undefined);
      expect(snap.val()).to.equal(null);
    });

    it('returns primitives created with ".value" property', function(){
      var snap = new FakeSnapshot({'.priority':1,'.value':true});
      expect(snap.val()).to.equal(true);

      snap = new FakeSnapshot({'.priority':2,'.value':false});
      expect(snap.val()).to.equal(false);

      snap = new FakeSnapshot({'.priority':2,'.value':'hello'});
      expect(snap.val()).to.equal('hello');
    });

    it('returns primitives created with ".value" property', function(){
      var snap = new FakeSnapshot({'.priority':1,'.value':true});
      expect(snap.val()).to.equal(true);

      snap = new FakeSnapshot({'.priority':2,'.value':false});
      expect(snap.val()).to.equal(false);

      snap = new FakeSnapshot({'.priority':2,'.value':'hello'});
      expect(snap.val()).to.equal('hello');
    });

    it('filters ".priority" from the output', function(){
      var snap = new FakeSnapshot({'.priority':1,a:'a',b:'b'});
      expect(snap.val()).to.eql({a:'a',b:'b'});
    });
  });

  describe('#child(path)',function(){
    it('returns a snap representing the given child node',function(){
      var snap = new FakeSnapshot({a:'b',c:'d',e:{f:'g'}});
      expect(snap.child('a').val()).to.equal('b');
      expect(snap.child('c').val()).to.equal('d');
      expect(snap.child('e').val()).to.eql({f:'g'});
    });

    it('slash separated path walks the object tree',function(){
      var snap = new FakeSnapshot({e:{f:'g'}});
      expect(snap.child('e/f').val()).to.equal('g');
    });

    it('no data for that child returns null',function(){
      var snap = new FakeSnapshot({a:'b'});
      expect(snap.child('c').val()).to.be.null;
    });

    it('slash spearated path with a falsy middle node has a null value',function(){
      var snap = new FakeSnapshot({e:false,f:0});
      expect(snap.child('e/f').val()).to.equal(null);
      expect(snap.child('f/g').val()).to.equal(null);
    });

    it('slash separated path - has null value several layers past the deepest defined node',function(){
      var snap = new FakeSnapshot({a:'b'});
      expect(snap.child('a/b/c/d/e/f').val()).to.equal(null);
    });

    it('throws if path is invalid',function(){
      expect(function(){
        new FakeSnapshot({a:'b'}).child('$invalidpath');
      }).to.throw();
    });
  });
});