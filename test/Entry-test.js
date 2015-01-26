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
    var value1;
    var pp1 = new Entry(mockFbBase.push());
    pp1.on('value',function(v){
      value1 = v;
    });
    pp1.set('hello');
    mockFbBase.flush();
    expect(value1).to.equal('hello');

    var value2;
    var pp2 = new Entry(pp1.ref());
    pp2.on('value',function(v){
      value2 = v;
    });
    mockFbBase.flush();
    expect(value2).to.equal('hello');
  });

  it('most recent value',function(){
    var value1;
    var pp1 = new Entry(mockFbBase.push());
    pp1.on('value',function(v){
      value1 = v;
    });
    pp1.set('hello');
    mockFbBase.flush();
    expect(value1).to.equal('hello');
    pp1.set('goodbye');
    mockFbBase.flush();
    expect(value1).to.equal('goodbye');

    var value2;
    var pp2 = new Entry(pp1.ref());
    pp2.on('value',function(v){
      value2=v;
    });
    mockFbBase.flush();
    expect(value2).to.equal('goodbye');
  });

});