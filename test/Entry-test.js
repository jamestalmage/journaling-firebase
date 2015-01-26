describe('Entry',function(){

  var expect = require('chai').expect;
  var rewire = require('rewire');
  var MockFirebase = require('mockfirebase').MockFirebase;

  var Entry,mockFbBase;

  beforeEach(function(){
    Entry = rewire('../src/Entry');
    Entry.__set__('Firebase',MockFirebase);
    mockFbBase = new MockFirebase();
    var ct = 0;
    MockFirebase.setClock(function(){return ct++});
  });

  afterEach(function(){
    MockFirebase.restoreClock();
  });

  it('get set works',function(){
    var pp1 = new Entry(mockFbBase.push());
    pp1.set('hello');
    mockFbBase.flush();
    expect(pp1.get()).to.equal('hello');

    var pp2 = new Entry(pp1.ref());
    mockFbBase.flush();
    expect(pp2.get()).to.equal('hello');
  });

  it('most recent value',function(){
    var pp1 = new Entry(mockFbBase.push());
    pp1.set('hello');
    mockFbBase.flush();
    expect(pp1.get()).to.equal('hello');
    pp1.set('goodbye');
    mockFbBase.flush();
    expect(pp1.get()).to.equal('goodbye');

    var pp2 = new Entry(pp1.ref());
    mockFbBase.flush();
    expect(pp2.get()).to.equal('goodbye');
  });

});