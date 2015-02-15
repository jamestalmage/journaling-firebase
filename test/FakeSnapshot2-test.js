describe('FakeSnapshot2',function() {
  'use strict';

  var chai = require('chai');
  var expect = chai.expect;
  var sinon = require('sinon');
  chai.use(require('sinon-chai'));

  var FakeSnapshot = require('../src/FakeSnapshot2')();


  function makeSnapshot(val,pri){
    return new FakeSnapshot('https://blah.com/test',val,pri);
  }

  describe('#key()',function(){
    it(' is described by the URI',function(){
      expect(new FakeSnapshot('https://blah.com/test','a').key()).to.equal('test');
      //expect(new FakeSnapshot('https://blah.com/','a').key()).to.equal(null);
    });

    it(' is aliased by #name()',function(){
      expect(new FakeSnapshot('https://blah.com/test','a').name()).to.equal('test');
      //expect(new FakeSnapshot('https://blah.com/','a').name()).to.equal(null);
    });
  });

  describe('#val()',function(){
    it('returns the boolean value passed to constructor', function(){
      var snap = makeSnapshot(true);
      expect(snap.val()).to.equal(true);
    });

    it('returns the number value passed to constructor', function(){
      var snap = makeSnapshot(3);
      expect(snap.val()).to.equal(3);
    });

    it('returns the string value passed to constructor', function(){
      var snap = makeSnapshot('hello');
      expect(snap.val()).to.equal('hello');
    });

    it('returns an object deep equal to what was passed to constructor', function(){
      var snap = makeSnapshot({a:'a',b:'b'});
      expect(snap.val()).to.eql({a:'a',b:'b'});
    });

    it('returns a new copy of the object for each call', function(){
      var val = {a:'a',b:'b'};
      var snap = makeSnapshot(val);
      expect(snap.val()).not.to.equal(val);
    });

    it('returns null if constructor is passed null or undefined', function(){
      var snap = makeSnapshot(null);
      expect(snap.val()).to.equal(null);
      snap = makeSnapshot(undefined);
      expect(snap.val()).to.equal(null);
    });

    it('returns primitives created with ".value" property', function(){
      var snap = makeSnapshot({'.priority':1,'.value':true});
      expect(snap.val()).to.equal(true);

      snap = makeSnapshot({'.priority':2,'.value':false});
      expect(snap.val()).to.equal(false);

      snap = makeSnapshot({'.priority':2,'.value':'hello'});
      expect(snap.val()).to.equal('hello');
    });

    it('returns primitives created with ".value" property', function(){
      var snap = makeSnapshot({'.priority':1,'.value':true});
      expect(snap.val()).to.equal(true);

      snap = makeSnapshot({'.priority':2,'.value':false});
      expect(snap.val()).to.equal(false);

      snap = makeSnapshot({'.priority':2,'.value':'hello'});
      expect(snap.val()).to.equal('hello');
    });

    it('filters ".priority" from the output', function(){
      var snap = makeSnapshot({'.priority':1,a:'a',b:'b'});
      expect(snap.val()).to.eql({a:'a',b:'b'});
    });
  });

  describe('#child(path)',function(){
    it('returns a snap representing the given child node',function(){
      var snap = makeSnapshot({a:'b',c:'d',e:{f:'g'}});
      expect(snap.child('a').val()).to.equal('b');
      expect(snap.child('c').val()).to.equal('d');
      expect(snap.child('e').val()).to.eql({f:'g'});
    });

    it('slash separated path walks the object tree',function(){
      var snap = makeSnapshot({e:{f:'g'}});
      expect(snap.child('e/f').val()).to.equal('g');
    });

    it('no data for that child returns null',function(){
      var snap = makeSnapshot({a:'b'});
      expect(snap.child('c').val()).to.be.null;
    });

    it('slash spearated path with a falsy middle node has a null value',function(){
      var snap = makeSnapshot({e:false,f:0});
      expect(snap.child('e/f').val()).to.equal(null);
      expect(snap.child('f/g').val()).to.equal(null);
    });

    it('slash separated path - has null value several layers past the deepest defined node',function(){
      var snap = makeSnapshot({a:'b'});
      expect(snap.child('a/b/c/d/e/f').val()).to.equal(null);
    });

    xit('throws if path is invalid',function(){
      expect(function(){
        makeSnapshot({a:'b'}).child('$invalidpath');
      }).to.throw();
    });
  });

  describe('#getPriority()',function(){
    it('can be set as third arg to constructor',function(){
      expect(makeSnapshot('hello',3).getPriority()).to.equal(3);
      expect(makeSnapshot('hello',0).getPriority()).to.equal(0);
      expect(makeSnapshot('hello').getPriority()).to.equal(null);
      expect(makeSnapshot('hello',null).getPriority()).to.equal(null);
      expect(makeSnapshot('hello','').getPriority()).to.equal('');
      expect(makeSnapshot('hello','test').getPriority()).to.equal('test');
    });

    it('can be set as ".priority" value',function(){
      expect(makeSnapshot({'.value':3,'.priority':3}).getPriority()).to.equal(3);
      expect(makeSnapshot({'.value':3,'.priority':''}).getPriority()).to.equal('');
      expect(makeSnapshot({'.value':3,'.priority':0}).getPriority()).to.equal(0);
      expect(makeSnapshot({'.value':3,'.priority':null}).getPriority()).to.equal(null);
    });

    it('can be set for children with ".priority" value',function(){
      expect(makeSnapshot({a:{'.value':3,'.priority':2}}).child('a').getPriority()).to.equal(2);
    });
  });

  describe('#hasChild',function(){
    it('is true if child exists',function(){
      expect(makeSnapshot({a:'a'}).hasChild('a')).to.equal(true);
    });

    it('is false if child does not exist',function(){
      expect(makeSnapshot({a:'a'}).hasChild('b')).to.equal(false);
    });
  });

  describe('#hasChildren()',function(){
    it('false if location has no data',function(){
      expect(makeSnapshot(null).hasChildren()).to.equal(false);
    });

    it('false if location contains a primitive',function(){
      expect(makeSnapshot('hello').hasChildren()).to.equal(false);
      expect(makeSnapshot(3).hasChildren()).to.equal(false);
      expect(makeSnapshot(true).hasChildren()).to.equal(false);
    });

    it('is true if object contains at least one value',function(){
      expect(makeSnapshot({a:'a'}).hasChildren()).to.equal(true);
    });
  });

  describe('#numChildren',function(){
    function testNumChildren(val,expected){
      it(JSON.stringify(val) + ' --> ' + expected, function(){
        expect(makeSnapshot(val).numChildren()).to.equal(expected);
      });
    }

    testNumChildren(null, 0);
    testNumChildren(true, 0);
    testNumChildren(false, 0);
    testNumChildren('hello', 0);
    testNumChildren(3, 0);
    testNumChildren(4, 0);
    testNumChildren(0, 0);
    testNumChildren({a:true}, 1);
    testNumChildren({b:true, c:false}, 2);
  });

  describe('#exportVal',function(){
    function testExportVal(val,pri,expected){
      if(expected === undefined){
        expected = pri;
        pri = undefined;
      }
      var message = 'snap(' + JSON.stringify(val) +
        (pri === undefined ? '' : ', ' + JSON.stringify(pri)) + ') --> ' + JSON.stringify(expected);
      it(message,function(){
        expect(makeSnapshot(val,pri).exportVal()).to.eql(expected);
      });
    }

    testExportVal(null,null);
    testExportVal(null,0,null);
    testExportVal(0,0,{'.value':0,'.priority':0});
    testExportVal(0,2,{'.value':0,'.priority':2});
    testExportVal('',2,{'.value':'','.priority':2});
    testExportVal('','',{'.value':'','.priority':''});
    testExportVal(3,3);
    testExportVal(3,5,{'.value':3,'.priority':5});
    testExportVal({a:'a',b:'b'},3, {a:'a',b:'b','.priority':3});
  });

  describe('#forEach()',function(){
    it('calls in keyOrder',function(){
      var snap = makeSnapshot({wilma:'mother',fred:'father'});
      var calls = [];
      snap.forEach(function(snap){
        calls.push(snap.key(), snap.val());
      });
      expect(calls).to.eql(['fred','father','wilma','mother']);
    });

    it('shortcut by returning true',function(){
      var snap = makeSnapshot({wilma:'mother',fred:'father'});
      var calls = [];
      snap.forEach(function(snap){
        calls.push(snap.key(), snap.val());
        return true;
      });
      expect(calls).to.eql(['fred','father']);
    });

    it('will returns true if shortcut',function(){
      var snap = makeSnapshot({wilma:'mother',fred:'father'});
      expect(snap.forEach(function(){return true;})).to.equal(true);
    });

    it('will not be true if notshortcut',function(){
      var snap = makeSnapshot({wilma:'mother',fred:'father'});
      expect(snap.forEach(function(){})).not.to.be.ok;
    });

    it('calls in priorityOrder',function(){
      var snap = makeSnapshot({
        wilma:{'.priority':1,'.value':'mother'},
        bambam:{'.priority':3,'.value':'child'},
        fred:{'.priority':2,'.value':'father'}}
      );
      var calls = [];
      snap.forEach(function(snap){
        calls.push(snap.key(), snap.val());
      });
      expect(calls).to.eql(['wilma','mother','fred','father','bambam','child']);
    });

    it('calls in priorityOrder (reversed)',function(){
      var snap = makeSnapshot({
        wilma:{'.priority':3,'.value':'mother'},
        bambam:{'.priority':1,'.value':'child'},
        fred:{'.priority':2,'.value':'father'}}
      );
      var calls = [];
      snap.forEach(function(snap){
        calls.push(snap.key(), snap.val());
      });
      expect(calls).to.eql(['bambam','child','fred','father','wilma','mother']);
    });

    it('nothing happens for null value',function(){
      var snap = makeSnapshot(null);
      var calls = [];
      snap.forEach(function(snap){
        calls.push(snap.key(), snap.val());
      });
      expect(calls).to.eql([]);
    });
  });

  describe('#exists',function(){
    it('false if value is null',function(){
      expect(makeSnapshot(null).exists()).to.equal(false);
    });

    it('true if it has a value',function(){
      expect(makeSnapshot('').exists()).to.equal(true);
      expect(makeSnapshot(0).exists()).to.equal(true);
      expect(makeSnapshot(false).exists()).to.equal(true);
      expect(makeSnapshot('hello').exists()).to.equal(true);
      expect(makeSnapshot(1).exists()).to.equal(true);
      expect(makeSnapshot(true).exists()).to.equal(true);
      expect(makeSnapshot({a:'true'}).exists()).to.equal(true);
    });

    it('on children',function(){
      var snap = makeSnapshot({a: true});
      expect(snap.child('a').exists()).to.equal(true);
      expect(snap.child('b').exists()).to.equal(false);
    });
  });
});