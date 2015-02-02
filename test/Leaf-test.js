describe('Entry',function(){

  var chai = require('chai');
  var expect = chai.expect;
  var rewire = require('rewire');
  var sinon = require('sinon');
  chai.use(require('sinon-chai'));
  var MockFirebase = require('mockfirebase').MockFirebase;

  var Leaf,mockFbBase;

  beforeEach(function(){
    Leaf = rewire('../src/Leaf');
    Leaf.__set__('Firebase',MockFirebase);
    mockFbBase = new MockFirebase();
    var ct = 0;
    MockFirebase.setClock(function(){return ct++});
  });

  afterEach(function(){
    MockFirebase.restoreClock();
  });

  it('set() causes a "value" event to be fired',function(){
    var calls1 = [];
    var ref = mockFbBase.push();
    var pp1 = new Leaf(ref);
    pp1.on('value',function(v){
      calls1.push(v.val());
    });
    pp1.set('hello');
    mockFbBase.flush();
    expect(calls1).to.eql([null,'hello']);

    var calls2 = [];
    var pp2 = new Leaf(ref);
    pp2.on('value',function(v){
      calls2.push(v.val());
    });
    mockFbBase.flush();
    expect(calls2).to.eql(['hello']);
  });

  it('set(null) will cause listeners to receive a value event',function(){
    var calls1 = [];
    var ref = mockFbBase.push();
    var entry = new Leaf(ref);
    entry.on('value',function(v){
      calls1.push(v.val());
    });
    entry.set('hello');
    mockFbBase.flush();
    entry.set(null);
    mockFbBase.flush();
    expect(calls1).to.eql([null,'hello',null]);
  });

  it('subsequent entries for the same ref will see the most recent value',function(){
    var calls1 = [];
    var ref = mockFbBase.push();
    var pp1 = new Leaf(ref);
    pp1.on('value',function(v){
      calls1.push(v.val());
    });
    pp1.set('hello');
    mockFbBase.flush();
    pp1.set('goodbye');
    mockFbBase.flush();
    expect(calls1).to.eql([null,'hello','goodbye']);

    var calls2 = [];
    var pp2 = new Leaf(ref);
    pp2.on('value',function(v){
      calls2.push(v.val());
    });
    mockFbBase.flush();
    expect(calls2).to.eql(['goodbye']);
  });

  it('#key() should return the key of the ref',function(){
    var ref = mockFbBase.child('testKey');
    var entry = new Leaf(ref);
    expect(entry.key()).to.equal('testKey');
  });

  it('#ref() should return the entry itself',function(){
    var ref = mockFbBase.push();
    var entry = new Leaf(ref);
    expect(entry.ref()).to.equal(entry);
  });

  describe('#once',function(){
    it('adds a once listener to the ref',function(){
      var ref = mockFbBase.push();
      ref.push().setWithPriority({value:1,time:2},2);
      ref.flush();
      var entry = new Leaf(ref);
      var spy = sinon.spy(function(snap){
        expect(snap.val()).to.equal(1);
      });
      entry.once('value',spy);
      ref.flush();
      ref.push().setWithPriority({value:3,time:4},4);
      ref.flush();
      expect(spy).to.have.been.calledOnce;
    });

    it('throws an error if you try any eventType besides "value"',function(){
      var ref = mockFbBase.push();
      var entry = new Leaf(ref);
      expect(function(){
        entry.once('child_added',function(){});
      }).to.throw();
      expect(function(){
        entry.once('child_moved',function(){});
      }).to.throw();
      expect(function(){
        entry.once('child_removed',function(){});
      }).to.throw();
    });
  });

  describe('#on',function(){
    it('adds a listener to the ref',function(){
      var ref = mockFbBase.push();
      ref.push().setWithPriority({value:1,time:2},2);
      ref.flush();
      var entry = new Leaf(ref);
      var spy = sinon.spy(function(snap){
        expect(snap.val() == 1 || snap.val() == 3).to.equal(true);
      });
      entry.on('value',spy);
      ref.flush();
      ref.push().setWithPriority({value:3,time:4},4);
      ref.flush();
      expect(spy).to.have.been.calledTwice;
    });

    it('throws an error if you try any eventType besides "value"',function(){
      var ref = mockFbBase.push();
      var entry = new Leaf(ref);
      expect(function(){
        entry.on('child_added',function(){});
      }).to.throw();
    });

    it('works with autoflush',function(){
      var ref = mockFbBase.push();
      ref.push({value:'hello'});
      ref.autoFlush(true);
      var leaf = new Leaf(ref);
      var val;
      leaf.on('value',function(snap){
        val = snap.val();
      });
      expect(val).to.equal('hello');
    });
  });

  describe('#off',function(){
    it('deregisters listeners',function(){
      var ref = mockFbBase.push();
      ref.push().setWithPriority({value:1,time:2},2);
      ref.flush();
      var entry = new Leaf(ref);
      var spy = sinon.spy();
      entry.on('value',spy);
      ref.flush();
      entry.off('value',spy);
      ref.push().setWithPriority({value:3,time:4},4);
      ref.flush();
      expect(spy).to.have.been.calledOnce;
    });
  });

});