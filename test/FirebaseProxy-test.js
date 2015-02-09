'use strict';

var sinon = require('sinon');
var match = sinon.match;
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));

describe('FirebaseProxy',function(){

  var FirebaseProxy = require('../src/FirebaseProxy');

  var fbWrapper, proxy, spy, spy1, spy2, spy3, spy4;

  beforeEach(function(){
    fbWrapper = {
      startWatching:sinon.spy(),
      stopWatching:sinon.spy()
    };
    proxy = new FirebaseProxy(fbWrapper);
    spy = sinon.spy();
    spy1 = sinon.spy();
    spy2 = sinon.spy();
    spy3 = sinon.spy();
    spy4 = sinon.spy();
  });

  function snapVal(expectedVal,pri, key){
    var message = 'snapshot value of ' + JSON.stringify(expectedVal);
    var testPri = arguments.length > 1 && pri !== false;
    var testKey = arguments.length > 2;
    if(testPri){
      message += ', and priority ' + JSON.stringify(pri);
    }
    if(testKey){
      message += ', and key ' + JSON.stringify(key);
    }
    return sinon.match(function(snap){
      try {
        expect(snap.val(), 'snap value').to.eql(expectedVal);
        if(testPri){
          expect(snap.getPriority(),'snap priority').to.equal(pri);
        }
        if(testKey){
          expect(snap.key(),'snap key').to.equal(key);
        }
      }
      catch(e){
        return false;
      }
      return true;
    }, message);
  }

  function resetSpies(){
    for(var i = 0; i < arguments.length; i++){
      arguments[i].reset();
    }
  }


  describe('on(path, "value", listener)',function(){
    it('tells wrapper to startWatching at the specified location',function(){
      var path = 'a/b'.split('/');
      proxy.on(path,'value',spy);

      expect(fbWrapper.startWatching).to.have.been.calledOnce;
      expect(fbWrapper.startWatching.firstCall.args[0]).to.eql('a/b');
    });

    it('does not startWatching the same location twice',function(){
      var path = 'a/b'.split('/');
      proxy.on(path,'value',spy1);
      proxy.on(path,'value',spy2);

      expect(fbWrapper.startWatching).to.have.been.calledOnce;
    });

    it('calls startWatching with child watch paths that should be to cancelled',function(){
      var path = 'a/b'.split('/');
      var path1 = 'a/b/c'.split('/');
      var path2 = 'a/b/d'.split('/');

      proxy.on(path1, 'value', spy1);
      proxy.on(path2, 'value', spy2);
      expect(fbWrapper.startWatching).to.have.been.calledTwice.and.calledWith('a/b/c').and.calledWith('a/b/d');
      proxy.on(path, 'value', spy2);
      expect(fbWrapper.startWatching).to.have.been.calledThrice;
      expect(fbWrapper.startWatching.thirdCall.args[0]).to.equal('a/b');
      expect(fbWrapper.startWatching.thirdCall.args[1]).to.include('a/b/c');
      expect(fbWrapper.startWatching.thirdCall.args[1]).to.include('a/b/d');
    });

    it('calls startWatching with path of common parent of nearest other watcher',function(){
      var path1 = 'a/b/c'.split('/');
      var path2 = 'a/d/e'.split('/');

      proxy.on(path1,'value',spy1);
      proxy.on(path2,'value',spy2);
      expect(fbWrapper.startWatching).to.have.been.calledTwice
        .and.calledWith('a/b/c',[],null)
        .and.calledWith('a/d/e',[],'a');
    });

    it('listener will be called immediately if data is already cached',function(){
      var path = 'https://mock/a/b'.split('/');

      proxy.on(path,'value',spy1);  // listen to the location so data will be cached
      proxy.on_value(path,{c:'d'},3); // provide the data to cache

      proxy.on(path,'value',spy2);

      expect(spy2).to.have.been.calledOnce;
      var snap2 = spy2.firstCall.args[0];
      expect(snap2.val()).to.eql({c:'d'});
      expect(snap2.key()).to.eql('b');
      expect(snap2.getPriority()).to.eql(3);
    });

    it('listener will be called immediately if data is already cached with a falsie value',function(){
      var path = 'https://mock/a/b'.split('/');

      proxy.on(path,'value',spy1);  // listen to the location so data will be cached
      proxy.on_value(path,false); // provide the data to cache

      proxy.on(path,'value',spy2);

      expect(spy2).to.have.been.calledOnce.and.calledWith(snapVal(false));
    });

    it('listener will be called immediately if data is already cached by a parent',function(){
      var path = 'https://mock/a/b'.split('/');
      var path2 = 'https://mock/a/b/c'.split('/');

      proxy.on(path,'value',spy1);  // listen to the location so data will be cached
      proxy.on_value(path,{c:'d'}); // provide the data to cache

      proxy.on(path2,'value',spy2);

      expect(spy2).to.have.been.calledOnce;
      var snap2 = spy2.firstCall.args[0];
      expect(snap2.val()).to.eql('d');
      expect(snap2.key()).to.eql('c');
    });

    it('listener will be called immediately with null if already cached by parent listener',function(){
      var path = 'https://mock/a/b'.split('/');
      var path2 = 'https://mock/a/b/c'.split('/');

      proxy.on(path,'value',spy1);  // listen to the location so data will be cached
      proxy.on_value(path,{d:'e'}); // provide the data to cache

      proxy.on(path2,'value',spy2);

      expect(spy2).to.have.been.calledOnce.and.calledWith(snapVal(null,null));
    });

    it('listener will be called immediately with null if already cached by parent listener (falsy parent)',function(){
      var path = 'https://mock/a/b'.split('/');
      var path2 = 'https://mock/a/b/c'.split('/');

      proxy.on(path,'value',spy1);  // listen to the location so data will be cached
      proxy.on_value(path,false); // provide the data to cache

      proxy.on(path2,'value',spy2);

      expect(spy2).to.have.been.calledOnce.and.calledWith(snapVal(null,null));
    });
  });

  describe('off(path, eventType, listener, [context]',function(){
    it('deregisters listeners',function(){
      var path = 'https://mock/a/b'.split('/');

      proxy.on(path,'value',spy);
      proxy.on_value(path,3);
      expect(spy).to.have.been.calledOnce.and.calledWith(snapVal(3));

      spy.reset();
      proxy.off(path,'value',spy);
      proxy.on_value(path,4);
      expect(spy).not.to.have.been.called;
    });

    it('will call stopWatching on the wrapper', function(){
      var path = 'https://mock/a/b'.split('/');

      proxy.on(path,'value',spy);
      //var cb = fbWrapper.on.firstCall.args[2];

      expect(fbWrapper.stopWatching).not.to.have.been.called;
      proxy.off(path,'value',spy);
      expect(fbWrapper.stopWatching).to.have.been.calledOnce;
      expect(fbWrapper.stopWatching.firstCall.args[0]).to.eql('https://mock/a/b');
      //expect(fbWrapper.off.firstCall.args[1]).to.equal('value');
      //expect(fbWrapper.off.firstCall.args[2]).to.equal(cb);
    });

    it('will not call stopWatching until all listeners are removed', function(){
      var path = 'https://mock/a/b'.split('/');

      proxy.on(path,'value',spy1);
      proxy.on(path,'value',spy2);

      expect(fbWrapper.stopWatching).not.to.have.been.called;
      proxy.off(path,'value',spy1);
      expect(fbWrapper.stopWatching).not.to.have.been.called;
      proxy.off(path,'value',spy2);
      expect(fbWrapper.stopWatching).to.have.been.calledOnce;
      expect(fbWrapper.stopWatching.firstCall.args[0]).to.eql('https://mock/a/b');
    });

    it('will not call stopWatching() if there were no listeners at that path in the first place', function(){
      var path1 = 'https://mock/a/b'.split('/');
      var path2 = 'https://mock/a/b/c'.split('/');
      var path3 = 'https://mock/a/b/c/d'.split('/');

      proxy.on(path2,'value',spy1);
      proxy.off(path1,'value',spy2);
      proxy.off(path3,'value',spy3);
      expect(fbWrapper.stopWatching).not.to.have.been.called;
    });

    it('if it stops watching a location, it will start again as necessary',function(){
      var path1 = 'https://mock/a/b'.split('/');
      proxy.on(path1,'value',spy1);
      proxy.on(path1,'value',spy2);
      proxy.off(path1,'value',spy1);
      proxy.off(path1,'value',spy2);
      expect(fbWrapper.startWatching).to.have.been.calledOnce;
      expect(fbWrapper.stopWatching).to.have.been.calledOnce;
      proxy.on(path1,'value',spy);
      expect(fbWrapper.startWatching).to.have.been.calledTwice;
    });

    it('turning off all listeners at a child path will not call stop listening',function(){
      var path1 = 'https://mock/a/b'.split('/');
      var path2 = 'https://mock/a/b/c'.split('/');
      proxy.on(path1,'value',spy1);
      proxy.on(path2,'value',spy2);
      proxy.off(path2,'value',spy2);
      expect(fbWrapper.startWatching).to.have.been.calledOnce;
      expect(fbWrapper.stopWatching).not.to.have.been.called;
    });

    it('stopWatching will be called with all child paths to start watching at',function(){
      var path = 'https://mock/a/b'.split('/');
      var path1 = 'https://mock/a/b/c'.split('/');
      var path2 = 'https://mock/a/b/d'.split('/');
      proxy.on(path,'value',spy);
      proxy.on(path1,'value',spy2);
      proxy.on(path2,'value',spy3);
      proxy.off(path,'value',spy);
      expect(fbWrapper.startWatching).to.have.been.calledOnce;
      expect(fbWrapper.stopWatching).to.have.been.calledOnce;
      expect(fbWrapper.stopWatching.firstCall.args[0]).to.equal('https://mock/a/b');
      expect(fbWrapper.stopWatching.firstCall.args[1]).to.include('https://mock/a/b/c');
      expect(fbWrapper.stopWatching.firstCall.args[1]).to.include('https://mock/a/b/d');
    });

    it('stopWatching will be called with common parent path',function(){
      var path1 = 'https://mock/a/b/c/e'.split('/');
      var path2 = 'https://mock/a/b/d/f'.split('/');
      proxy.on(path1,'value',spy1);
      proxy.on(path2,'value',spy2);
      proxy.on_value('https://mock/a/b/c'.split('/'),{e:'foo'});
      proxy.on_value('https://mock/a/b/d'.split('/'),{f:'bar'});
      proxy.off(path1,'value',spy1);
      expect(fbWrapper.stopWatching).to.have.been.calledOnce;
      expect(fbWrapper.stopWatching.firstCall.args[0]).to.equal('https://mock/a/b/c/e');
      expect(fbWrapper.stopWatching.firstCall.args[1]).to.eql([]);
      expect(fbWrapper.stopWatching.firstCall.args[2]).to.equal('https://mock/a/b');
    });
  });

  describe('on_value(path, value, [priority])',function(){
    it('will call registered value callbacks',function(){
      var path = 'https://mock/a/b'.split('/');
      proxy.on(path,'value',spy1);
      proxy.on(path,'value',spy2);

      proxy.on_value(path,{c:'d'},3);

      expect(spy1).to.have.been.calledOnce;
      expect(spy2).to.have.been.calledOnce;

      var snap1 = spy1.firstCall.args[0];
      expect(snap1.val()).to.eql({c:'d'});
      expect(snap1.key()).to.eql('b');
      expect(snap1.getPriority()).to.eql(3);

      var snap2 = spy2.firstCall.args[0];
      expect(snap2.val()).to.eql({c:'d'});
      expect(snap2.key()).to.eql('b');
      expect(snap2.getPriority()).to.eql(3);
    });

    it('does nothing if there are no values registered at that location', function(){
      var path = 'https://mock/a/b'.split('/');
      proxy.on_value(path,{c:'d'});
    });

    it('will call value listeners on children', function(){
      var path1 = 'https://mock/a/b'.split('/');
      var path2 = 'https://mock/a/b/c'.split('/');

      proxy.on(path2,'value',spy2);

      proxy.on_value(path1,{c:'d'});

      expect(spy2).to.have.been.calledOnce;
      var snap2 = spy2.firstCall.args[0];
      expect(snap2.val()).to.eql('d');
      expect(snap2.key()).to.eql('c');
      expect(snap2.getPriority()).to.eql(null);
    });

    it('will call listeners on children (oldChild === null, newChild === false)', function(){
      var path1 = 'https://mock/a/b'.split('/');
      var path2 = 'https://mock/a/b/c'.split('/');
      proxy.on(path2,'value',spy);
      proxy.on_value(path1,{a:'d'});
      expect(spy).to.have.been.calledOnce.and.calledWith(snapVal(null));
      spy.reset();
      proxy.on_value(path1,{c:false});
      expect(spy).to.have.been.calledOnce.and.calledWith(snapVal(false));
    });

    it('will call child_added listeners for new children',function(){
      var path1 = 'https://mock/a/b'.split('/');

      proxy.on(path1,'child_added',spy1);
      proxy.on_value(path1,{a:'a'});

      expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal('a',null,'a'));
    });

    it('will call child_changed listeners for changed children',function(){
      var path1 = 'https://mock/a/b'.split('/');

      proxy.on(path1,'child_changed',spy1);
      proxy.on_value(path1,{a:'a'}); //not called for the initial value
      proxy.on_value(path1,{a:'b'});
      proxy.on_value(path1,null); //not called on removal

      expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal('b',null,'a'));
    });

    it('will call child_changed listeners for child with changed priority',function(){
      var path1 = 'https://mock/a/b'.split('/');

      proxy.on(path1,'child_changed',spy1);
      proxy.on_value(path1,{a:'a'}); //not called for the initial value
      proxy.on_value(path1,{a:{'.value':'a','.priority':1}});
      proxy.on_value(path1,null); //not called on removal

      expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal('a',1,'a'));
    });

    it('will call listeners on parents to the supplied path',function(){
      var path1 = 'https://mock/a/b'.split('/');
      var path2 = 'https://mock/a/b/c'.split('/');

      proxy.on(path1,'child_added',spy1);
      proxy.on(path1,'child_changed',spy2);
      proxy.on(path1,'child_removed',spy3);
      proxy.on(path1,'value',spy4);
      proxy.on_value(path2,'c'); //not called for the initial value
      proxy.on_value(path2,'d');
      proxy.on_value(path2,null); //not called on removal

      expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal('c',null,'c')); // child_added
      expect(spy2).to.have.been.calledOnce.and.calledWith(snapVal('d',null,'c')); // child_changed
      expect(spy3).to.have.been.calledOnce.and.calledWith(snapVal('d',null,'c')); // child_removed - called with removed value
      expect(spy4).to.have.been.calledThrice            //value
        .and.calledWith(snapVal({c:'c'}, null, 'b'))
        .and.calledWith(snapVal({c:'d'}, null, 'b'))
        .and.calledWith(snapVal(null, null, 'b'));
    });

    it('will call child_removed listeners for removed children',function(){
      var path1 = 'https://mock/a/b'.split('/');

      proxy.on(path1,'child_removed',spy1);
      proxy.on_value(path1,{a:'a'}); //not called for the initial value
      proxy.on_value(path1,{a:'b'}); // not called for changed values
      proxy.on_value(path1,null);

      expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal('b',null,'a'));
    });

    it('removing a node will delete all empty parent nodes as well',function(){
      var path1 = 'https://mock/a'.split('/');
      var path2 = 'https://mock/a/b/c'.split('/');

      var latestValue;
      function setLatest(snap){
        latestValue = snap.val();
      }
      proxy.on(path1,'value',setLatest);

      proxy.on_value(path1,{d:'foo',b:{'.priority':3,c:'bar'}});
      expect(latestValue).to.eql({d:'foo',b:{c:'bar'}});
      proxy.on_value(path2,null);
      expect(latestValue).to.eql({d:'foo'});
    });

    it('will call value listeners if priority changes but value does not',function(){
      var path = 'https://mock/a/b'.split('/');
      proxy.on(path,'value',spy);

      proxy.on_value(path,'a',1);
      expect(spy,'firstCall').to.have.been.calledOnce.and.calledWith(snapVal('a',1));
      spy.reset();
      proxy.on_value(path,'a',1);
      expect(spy).not.to.have.been.called;
      spy.reset();
      proxy.on_value(path,'a',2);
      expect(spy,'val: "a", 1 -> 2').to.have.been.calledOnce.and.calledWith(snapVal('a',2));
      spy.reset();
      proxy.on_value(path,'a');
      expect(spy,'val: "a", pri: 2 -> null').to.have.been.calledOnce.and.calledWith(snapVal('a',null));
      spy.reset();
      proxy.on_value(path,'a',3);
      expect(spy,'val: "a", pri: null -> 3').to.have.been.calledOnce.and.calledWith(snapVal('a',3));
      spy.reset();
      proxy.on_value(path,{a:'a'});
      expect(spy,'val: "a" -> {a:"a"}, pri: 3 -> null').to.have.been.calledOnce.and.calledWith(snapVal({a:'a'},null));
      spy.reset();
      proxy.on_value(path,{a:'a'},4);
      expect(spy,'val: {a:"a"}, pri: null -> 4').to.have.been.calledOnce.and.calledWith(snapVal({a:'a'},4));
      spy.reset();
      proxy.on_value(path,{a:'a'});
      expect(spy,'val: {a:"a"}, pri: 4 -> null').to.have.been.calledOnce.and.calledWith(snapVal({a:'a'},null));
    });

    it('will call value listeners if primitive value changes, but non-null priority does not change',function(){
      var path = 'https://mock/a/b'.split('/');
      proxy.on(path,'value',spy);

      proxy.on_value(path,'a',1);
      expect(spy,'firstCall').to.have.been.calledOnce.and.calledWith(snapVal('a',1));
      spy.reset();
      proxy.on_value(path,'b',1);
      expect(spy,'val: a -> b, pri:1').to.have.been.calledOnce.and.calledWith(snapVal('b',1));
      spy.reset();
    });

    describe('will not re-call listeners if value does not change', function(){
      it('(primitives)',function(){
        var path = 'https://mock/a/b'.split('/');
        proxy.on(path,'value',spy);

        proxy.on_value(path,'a');
        expect(spy).to.have.been.calledOnce.and.calledWith(snapVal('a'));
        spy.reset();
        proxy.on_value(path,'a');
        expect(spy,'a').not.to.have.been.called;

        proxy.on_value(path,true);
        expect(spy).to.have.been.calledOnce.and.calledWith(snapVal(true));
        spy.reset();
        proxy.on_value(path,true);
        expect(spy,'true').not.to.have.been.called;

        proxy.on_value(path,false);
        expect(spy).to.have.been.calledOnce.and.calledWith(snapVal(false));
        spy.reset();
        proxy.on_value(path,false);
        expect(spy,'false').not.to.have.been.called;

        proxy.on_value(path,0);
        expect(spy).to.have.been.calledOnce.and.calledWith(snapVal(0));
        spy.reset();
        proxy.on_value(path,0);
        expect(spy,'0').not.to.have.been.called;

        proxy.on_value(path,1);
        expect(spy).to.have.been.calledOnce.and.calledWith(snapVal(1));
        spy.reset();
        proxy.on_value(path,1);
        expect(spy,'1a').not.to.have.been.called;
        proxy.on_value(path,1);
        expect(spy,'1b').not.to.have.been.called;
      });

      it('(deeply equal objects)',function(){
        var path = 'https://mock/a/b'.split('/');
        var path1 = path.slice().concat('a');
        var path2 = path.slice().concat('b');
        proxy.on(path,'value',spy);
        proxy.on(path1,'value',spy1);
        proxy.on(path2,'value',spy2);

        proxy.on_value(path,{a:'a',b:'b'});
        expect(spy).to.have.been.calledOnce.and.calledWith(snapVal({a:'a',b:'b'}));
        expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal('a'));
        expect(spy2).to.have.been.calledOnce.and.calledWith(snapVal('b'));

        resetSpies(spy,spy1,spy2);
        proxy.on_value(path,{a:'a',b:'b'});
        expect(spy).not.to.have.been.called;
        expect(spy1).not.to.have.been.called;
        expect(spy2).not.to.have.been.called;

        resetSpies(spy,spy1,spy2);
        proxy.on_value(path,{a:'a',b:'c'});
        expect(spy).to.have.been.calledOnce.and.calledWith(snapVal({a:'a',b:'c'}));
        expect(spy1).not.to.have.been.called;
        expect(spy2).to.have.been.calledOnce.and.calledWith(snapVal('c'));

        resetSpies(spy,spy1,spy2);
        proxy.on_value(path,{a:'d',b:'c'});
        expect(spy).to.have.been.calledOnce.and.calledWith(snapVal({a:'d',b:'c'}));
        expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal('d'));
        expect(spy2).not.to.have.been.called;
      });
    });

    describe('will call child listeners with null if there is no value for that path',function(){
      it('first time value',function(){
        var path = 'https://mock/a/b'.split('/');
        var path1 = path.slice().concat('a');
        var path2 = path.slice().concat('b');
        proxy.on(path,'value',spy);
        proxy.on(path1,'value',spy1);
        proxy.on(path2,'value',spy2);

        proxy.on_value(path,null);
        expect(spy).to.have.been.calledOnce.and.calledWith(snapVal(null));
        expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal(null));
        expect(spy2).to.have.been.calledOnce.and.calledWith(snapVal(null));
      });

      it('removal',function(){
        var path = 'https://mock/a/b'.split('/');
        var path1 = path.slice().concat('a');
        var path2 = path.slice().concat('b');
        proxy.on(path,'value',spy);
        proxy.on(path1,'value',spy1);
        proxy.on(path2,'value',spy2);

        proxy.on_value(path,{b:'b'});
        resetSpies(spy,spy1,spy2);
        proxy.on_value(path,{a:'a'});
        expect(spy).to.have.been.calledOnce.and.calledWith(snapVal({a:'a'}));
        expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal('a'));
        expect(spy2).to.have.been.calledOnce.and.calledWith(snapVal(null));
      });
    });
  });

  describe('_getData(path)',function(){
     it('will get the data from the specified path',function(){
       var path1 = 'https://mock/a/b/c'.split('/');
       proxy.on(path1,'value',spy);
       proxy.on_value(path1,{a:'b'});
       expect(proxy._getData(path1)).to.eql({a:'b'});
     });

     it('will return null if no data exists',function(){
       var path1 = 'https://mock/a/b/c'.split('/');
       var path2 = 'https://mock/a/b/d'.split('/');
       proxy.on(path1,'value',spy);
       proxy.on_value(path1,{a:'b'});
       expect(proxy._getData(path2)).to.equal(null);
     });
  });

  describe('pruning behavior',function(){
    it('will prune unwatched data once listeners are removed',function(){
      var path1 = 'https://mock/a/b/c'.split('/');
      proxy.on(path1,'value',spy);
      proxy.on_value(path1,{a:'b'});
      proxy.off(path1,'value',spy);
      expect(proxy._getData(path1)).to.equal(null);
    });

    it('pruning can be disabled for a given tree',function(){
      var path = 'https://mock/a/b'.split('/');
      var path1 = 'https://mock/a/b/c'.split('/');
      var path2 = 'https://mock/a/b/d'.split('/');
      proxy.on(path1,'value',spy1);
      proxy.on(path2,'value',spy2);
      proxy.on_value(path,{c:'c',d:'d'},null,true);
      proxy.off(path1,'value',spy1);
      expect(proxy._getData(path)).to.eql({c:'c',d:'d'});
    });

    it('nodes with disabled pruning will be deleted as a whole',function(){
      var path = 'https://mock/a/b'.split('/');
      var path1 = 'https://mock/a/b/c'.split('/');
      var path2 = 'https://mock/a/b/d'.split('/');
      proxy.on(path1,'value',spy1);
      proxy.on(path2,'value',spy2);
      proxy.on_value(path,{c:'c',d:'d'},null,true);
      proxy.off(path1,'value',spy1);
      proxy.off(path2,'value',spy2);
      expect(proxy._getData(path)).to.eql(null);
    });

    it('pruning will not affect siblings',function(){
      var path = 'https://mock/a/b'.split('/');
      var path1 = 'https://mock/a/b/c'.split('/');
      var path2 = 'https://mock/a/b/d'.split('/');
      var path3 = 'https://mock/a/e'.split('/');
      var path4 = 'https://mock/a/e/c'.split('/');
      proxy.on(path1,'value',spy1);
      proxy.on(path2,'value',spy2);
      proxy.on(path4,'value',spy3);
      proxy.on_value(path,{c:'c',d:'d'},null,true);
      proxy.on_value(path3,{c:'c',d:'d'},null,true);
      proxy.off(path1,'value',spy1);
      proxy.off(path2,'value',spy2);
      expect(proxy._getData(path)).to.eql(null);
      expect(proxy._getData(path3)).to.eql({c:'c',d:'d'});

      expect(proxy._getData('https://mock/a'.split('/'))).to.eql({e:{c:'c',d:'d'}});
    });
  });

});

describe('labeled if statement behavior',function(){
  /* jshint -W028 */

  // JSHINT Complains that using a label on an if statement is bad form,
  // but it plainly works (as proven by this test).
  // Leaving this test active to prove it works on all target platforms.
  it('works as expected',function(){
    var x;
    loop:if(true){
      for(var i = 2; i < 10; i++){
        x = i;
        break loop;
      }
      x = 'did not break';
    }
    expect(x).to.equal(2);
  });

});