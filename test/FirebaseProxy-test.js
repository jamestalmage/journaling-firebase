describe('FirebaseProxy',function(){

  var FirebaseProxy = require('../src/FirebaseProxy');
  var sinon = require('sinon');
  var match = sinon.match;
  var chai = require('chai');
  var expect = chai.expect;
  chai.use(require('sinon-chai'));

  var fbWrapper, proxy, spy, spy1, spy2;

  beforeEach(function(){
    fbWrapper = {
      on:sinon.spy()

    };
    proxy = new FirebaseProxy(fbWrapper);
    spy = sinon.spy();
    spy1 = sinon.spy();
    spy2 = sinon.spy();
  });

  function snapVal(expectedVal,pri){
    var message = 'snapshot value of ' + JSON.stringify(expectedVal);
    var testPri = arguments.length > 1;
    if(testPri){
      message += ', and priority' + JSON.stringify(pri);
    }
    return sinon.match(function(snap){
      expect(snap.val()).to.eql(expectedVal);
      if(testPri){
        expect(snap.getPriority()).to.equal(pri);
      }
      return true;
    }, message);
  }

  function resetSpies(){
    for(var i = 0; i < arguments.length; i++){
      arguments[i].reset();
    }
  }


  describe('on(value)',function(){
    it('adds a value listener at the specified location',function(){
      var path = 'a/b'.split('/');
      proxy.on(path,'value',spy);

      expect(fbWrapper.on).to.have.been.calledOnce;
      expect(fbWrapper.on.firstCall.args[0]).to.eql('a/b'.split('/'));
      expect(fbWrapper.on.firstCall.args[1]).to.eql('value');
      var cb = fbWrapper.on.firstCall.args[2];
      expect(cb).to.be.a('function');
    });

    it('does not add a second listener at the same location',function(){
      var path = 'a/b'.split('/');
      proxy.on(path,'value',spy1);
      proxy.on(path,'value',spy2);

      expect(fbWrapper.on).to.have.been.calledOnce;
    });

    it('callback submitted to wrapper will call `handleCallback` on proxy',function(){
      proxy.handleCallback = sinon.spy();
      var path = 'a/b'.split('/');
      proxy.on(path,'value',spy);
      var snap = {};

      var cb = fbWrapper.on.firstCall.args[2];
      expect(proxy.handleCallback).not.to.have.been.called;
      cb(snap);
      expect(proxy.handleCallback).to.have.been.calledOnce;
      expect(proxy.handleCallback).to.have.been.calledWith('a/b'.split('/'),'value',match.same(snap));
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

    it('will call listeners on children (oldChild === null, newChild === false', function(){
      var path1 = 'https://mock/a/b'.split('/');
      var path2 = 'https://mock/a/b/c'.split('/');
      proxy.on(path2,'value',spy);
      proxy.on_value(path1,{a:'d'});
      expect(spy).to.have.been.calledOnce.and.calledWith(snapVal(null));
      spy.reset();
      proxy.on_value(path1,{c:false});
      expect(spy).to.have.been.calledOnce.and.calledWith(snapVal(false));
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
        expect(spy,'1').not.to.have.been.called;
        proxy.on_value(path,1);
        expect(spy,'1').not.to.have.been.called;
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

});