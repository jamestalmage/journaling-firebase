'use strict';
describe('TreeNode',function(){
  //region Initialization

  // Assertion Framework
  var chai = require('chai');
  var expect = chai.expect;

  var sinon = require('sinon');
  chai.use(require('sinon-chai'));


  // Custom Sinon Matcher

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

  // Convenience Methods
  function resetSpies(){
    for(var i = 0; i < arguments.length; i++){
      arguments[i].reset();
    }
  }

  function isSpy(method){
    return (typeof method === 'function' && typeof method.getCall === 'function') || false;
  }

  function setAndFlush(opt_path, val, var_spies_to_reset){
    var spies = Array.prototype.slice.call(arguments,1);
    if(val === undefined || isSpy(val)){
      val = opt_path;
      opt_path = null;
    }
    else {
      spies.shift();
    }
    (opt_path ? node.child(opt_path, true) : node).setValue(val);
    node.flushChanges();
    resetSpies.apply(null,spies);
  }


  // Source Under Test
  var TreeNode = require('../src/TreeNode');


  // Test Initialization
  var node,spy1,spy2,spy3;

  beforeEach(function(){
    node = new TreeNode();
    spy1 = sinon.spy();
    spy2 = sinon.spy();
    spy3 = sinon.spy();
  });
  //endregion

  // TESTS

  describe('#setValue',function(){
    describe('returns true the first time it is called with a ',function(){
      it('string',function(){
        expect(node.setValue('foo')).to.equal(true);
      });

      it('false',function(){
        expect(node.setValue(false)).to.equal(true);
      });

      it('true',function(){
        expect(node.setValue(true)).to.equal(true);
      });

      it('0',function(){
        expect(node.setValue(0)).to.equal(true);
      });

      it('1',function(){
        expect(node.setValue(1)).to.equal(true);
      });

      it('object',function(){
        expect(node.setValue({a:'a'})).to.equal(true);
      });

      it('deep object',function(){
        expect(node.setValue({a:{b:'c'}})).to.equal(true);
      });
    });

    it('returns false the first time it is set with null',function(){
      expect(node.setValue(null)).to.equal(false);
    });

    describe('returns true if value is changed',function(){
      it('string',function(){
        node.setValue('foo');
        node.flushChanges();
        expect(node.setValue('bar')).to.equal(true);
      });

      it('boolean',function(){
        node.setValue(true);
        node.flushChanges();
        expect(node.setValue(false)).to.equal(true);
      });

      it('number',function(){
        node.setValue(1);
        node.flushChanges();
        expect(node.setValue(2)).to.equal(true);
      });

      it('type changes',function(){
        node.setValue(1);
        node.flushChanges();
        expect(node.setValue(true)).to.equal(true);
        node.flushChanges();
        expect(node.setValue('foo')).to.equal(true);
        node.flushChanges();
        expect(node.setValue(null)).to.equal(true);
      });

      it('deeply unequal object',function(){
        node.setValue({a:'a'});
        node.flushChanges();
        expect(node.setValue({a:'b'})).to.equal(true);
      });

      it('deep object',function(){
        node.setValue({a:{b:'c'}});
        node.flushChanges();
        expect(node.setValue({a:{b:'d'}})).to.equal(true);
      });
    });

    describe('returns false if value is unchanged ',function(){
      it('string',function(){
        node.setValue('foo');
        node.flushChanges();
        expect(node.setValue('foo')).to.equal(false);
      });

      it('boolean',function(){
        node.setValue(true);
        node.flushChanges();
        expect(node.setValue(true)).to.equal(false);
      });

      it('number',function(){
        node.setValue(1);
        node.flushChanges();
        expect(node.setValue(1)).to.equal(false);
      });

      it('null',function(){
        node.setValue(null);
        node.flushChanges();
        expect(node.setValue(null)).to.equal(false);
      });

      it('deeply unequal object',function(){
        node.setValue({a:'a'});
        node.flushChanges();
        expect(node.setValue({a:'a'})).to.equal(false);
      });

      it('deep object',function(){
        node.setValue({a:{b:'c'}});
        node.flushChanges();
        expect(node.setValue({a:{b:'c'}})).to.equal(false);
      });

      it('called twice before flushed',function(){
        node.setValue('a');
        node.flushChanges();
        expect(node.setValue('b')).to.equal(true);
        expect(node.setValue('a')).to.equal(false);
      });

      it('called twice before flushed - deep object',function(){
        node.setValue({a:{b:{c:'c'}}});
        node.flushChanges();
        expect(node.setValue({a:{b:{c:'d'}}})).to.equal(true);
        expect(node.setValue({a:{b:{c:'c'}}})).to.equal(false);
      });

      it('called twice before flushed - deep object - with new properties',function(){
        node.setValue({a:{b:{c:'c'}}});
        node.flushChanges();
        expect(node.setValue({a:{b:{d:'d'}}})).to.equal(true);
        expect(node.setValue({a:{b:{c:'c'}}})).to.equal(false);
      });
    });
  });

  describe('#initialized ',function(){
    it('returns false before setValue is called',function(){
      node.flushChanges();
      expect(node.initialized).to.equal(false);
    });

    describe('returns true once setValue is called with a ',function(){
      it('string',function(){
        setAndFlush('foo');
        expect(node.initialized).to.equal(true);
      });

      it('boolean',function(){
        setAndFlush(false);
        expect(node.initialized).to.equal(true);
      });

      it('number',function(){
        setAndFlush(3);
        expect(node.initialized).to.equal(true);
      });

      it('null',function(){
        setAndFlush(null);
        expect(node.initialized).to.equal(true);
      });

      it('object', function(){
        setAndFlush({a:'b'});
        expect(node.initialized).to.equal(true);
      });
    });
  });

  describe('#on() ',function(){
    describe('"value" listeners ',function(){
      it('are not called if setValue has never been called',function(){
        node.on('value',spy1);
        node.flushChanges();
        expect(spy1.called).to.equal(false);
      });

      it('are called if setValue was initially set to null',function(){
        node.on('value',spy1);
        setAndFlush(null);
        expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal(null));
      });

      it('are called when value changes', function(){
        node.on('value',spy1);
        node.setValue(true);
        expect(spy1.called).to.equal(false);
        node.flushChanges();
        expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal(true));
        spy1.reset();
        node.setValue(false);
        expect(spy1.called).to.equal(false);
        node.flushChanges();
        expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal(false));
      });

      it('are called when value changes - shallow object', function(){
        node.on('value',spy1);
        node.setValue({a:'a',b:'b'});
        expect(spy1.called).to.equal(false);
        node.flushChanges();
        expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal({a:'a',b:'b'}));
        spy1.reset();
        node.setValue({a:'a',b:'c'});
        expect(spy1.called).to.equal(false);
        node.flushChanges();
        expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal({a:'a',b:'c'}));
      });

      it('are called when value changes - deep object', function(){
        node.on('value',spy1);
        node.setValue({a:{b:{c:'c'}}});
        expect(spy1.called).to.equal(false);
        node.flushChanges();

        expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal({a:{b:{c:'c'}}}));
        spy1.reset();
        node.setValue({a:{b:{c:'d'}}});
        expect(spy1.called).to.equal(false);
        node.flushChanges();
        expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal({a:{b:{c:'d'}}}));
      });

      it('are not called when setValue() does not change anything', function(){
        node.setValue('foo');
        node.on('value',spy1);
        node.flushChanges();
        spy1.reset();
        node.setValue('foo');
        node.flushChanges();
        expect(spy1.called).to.equal(false);
      });

      it('are not called when setValue() does not change anything - shallow object', function(){
        node.setValue({a:'a',b:'b'});
        node.on('value',spy1);
        node.flushChanges();
        spy1.reset();
        node.setValue({a:'a',b:'b'});
        node.flushChanges();
        expect(spy1.called).to.equal(false);
      });

      it('are not called when setValue() does not change anything - deep object', function(){
        node.setValue({a:{b:{c:'c'}}});
        node.on('value',spy1);
        node.flushChanges();
        spy1.reset();
        node.setValue({a:{b:{c:'c'}}});
        node.flushChanges();
        expect(spy1.called).to.equal(false);
      });

      it('are called immediately when value has already been set', function(){
        node.setValue('foo');
        node.flushChanges();
        node.on('value',spy1);
        expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal('foo'));
      });

      it('are called immediately when value has already been set - shallow object', function(){
        node.setValue({a:'a',b:'b'});
        node.flushChanges();
        node.on('value',spy1);
        expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal({a:'a',b:'b'}));
      });

      it('are called immediately when value has already been set - deep object', function(){
        node.setValue({a:{b:{c:'c'}}});
        node.flushChanges();
        node.on('value',spy1);
        expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal({a:{b:{c:'c'}}}));
      });

      it('are called when setValue is called on child node', function(){
        node.setValue({a:'a'});
        node.on('value',spy1);
        node.flushChanges();
        spy1.reset();
        node.child('a').setValue('b');
        node.flushChanges();
        expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal({a:'b'}));
      });

      it('are called on a deep child', function(){
        node.setValue({a:{b:'c'}});
        node.on('value',spy1);
        node.flushChanges();
        spy1.reset();
        node.child('a/b').setValue('d');
        node.flushChanges();
        expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal({a:{b:'d'}}));
      });

      describe('on child nodes',function(){
        it('are called when the child\'s value changes' ,function(){
          node.setValue({a:'a'});
          node.child('a').on('value',spy1);
          node.flushChanges();
          spy1.reset();
          node.setValue({a:'b'});
          node.flushChanges();
          expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal('b'));
        });

        it('are not called when the child\'s value stays the same' ,function(){
          node.setValue({a:'a'});
          node.child('a').on('value',spy1);
          node.flushChanges();
          spy1.reset();
          node.setValue({a:'a'});
          node.flushChanges();
          expect(spy1.called).to.equal(false);
        });

        it('are called immediately on new children if value was already set', function(){
          node.setValue({a:'a'});
          node.flushChanges();
          node.child('b',true).on('value',spy1);
          node.child('a',true).on('value',spy2);
          expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal(null));
          expect(spy2).to.have.been.calledOnce.and.calledWith(snapVal('a',null,'a'));
        });

        it('creating new empty nodes does not schedule a flush', function(){
          setAndFlush({a:'a'});
          node.child('b',true).on('value',spy1);
          expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal(null));
          expect(node._flushScheduled).to.equal(false);
        });

        it('are called when the child gets a value on initial flush', function(){
          node.child('a',true).on('value',spy1);
          node.child('b',true).on('value',spy2);
          setAndFlush({a:'a'});
          expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal('a', null, 'a'));
          expect(spy2).to.have.been.calledOnce.and.calledWith(snapVal(null, null, 'b'));
        });
      });
    });

    describe('"child_changed" listeners ', function(){
      it('are called when an child leaf node changes values', function(){
        node.on('child_changed',spy1);
        setAndFlush({a:'a'});
        expect(spy1.called).to.equal(false);
        setAndFlush({a:'b'});
        expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal('b', null, 'a'));
      });

      it('are called when an child object node changes values', function(){
        node.on('child_changed',spy1);
        setAndFlush({a:{b:'c'}});
        setAndFlush({a:{b:'d'}});
        expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal({b:'d'}, null, 'a'));
      });

      it('are not called when new child nodes are created but set to null', function(){
        node.on('child_changed',spy1);
        setAndFlush({a:{b:'c'}});
        setAndFlush('a/d',null);
        expect(spy1.called).to.equal(false);
        expect(node.child('a/d').initialized).to.equal(true);
      });

      it('are called only for changed children', function(){
        node.on('child_changed',spy1);
        setAndFlush({a:'a',b:'b'});
        setAndFlush({a:'a',b:'d'});
        expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal('d',null,'b'));
      });

      it('are called for each changed child', function(){
        node.on('child_changed',spy1);
        setAndFlush({a:'a',b:'b'});
        setAndFlush({a:'c',b:'d'});
        expect(spy1).to.have.been.calledTwice
          .and.calledWith(snapVal('c',null,'a'))
          .and.calledWith(snapVal('d',null,'b'));
      });

      it('are not called if changes are reverted before a flush', function(){
        node.on('child_changed',spy1);
        setAndFlush({a:'a',b:'b'});
        node.setValue({a:'c',b:'d'});
        setAndFlush({a:'a',b:'b'});
        expect(spy1.called).to.equal(false);
      });
    });

    describe('"child_added" listeners ', function(){
      it('are called the first time child is set', function(){
        node.on('child_added', spy1);
        setAndFlush({a:'a'});
        expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal('a', null, 'a'));
      });

      it('are not called when the value changes', function(){
        node.on('child_added', spy1);
        setAndFlush({a:'a'});  //will call
        setAndFlush({a:'b'});  //won't call
        expect(spy1).to.have.been.calledOnce.and.calledWith(snapVal('a', null, 'a'));
      });

      it('are not called if new null child nodes are created', function(){
        node.on('child_added', spy1);
        setAndFlush({a:'a'}, spy1);
        setAndFlush('b', null);
        expect(spy1.called).to.equal(false);
      });

      it('are not called if value is removed', function(){
        node.on('child_added', spy1);
        setAndFlush({a:'a', b:'b'}, spy1);
        setAndFlush({a:'a'});
        expect(spy1.called).to.equal(false);
      });

      it('are called immediately for existing value', function(){
        setAndFlush({a:'a', b:'b'});
        node.on('child_added', spy1);
        expect(spy1).to.have.been.calledTwice
          .and.calledWith(snapVal('a', null, 'a'))
          .and.calledWith(snapVal('b', null, 'b'));
      });
    });

    describe('"child_removed" listeners ', function () {
      it('are not called for initial values', function () {
        node.on('child_removed', spy1);
        node.setValue({a:'a'});
        node.child('b', true).setValue(null);
        node.flushChanges();
        expect(spy1.called).to.equal(false);
      });

      it('are called when children get removed', function () {
        node.on('child_removed', spy1);
        setAndFlush({a:'a', b:'b', c:'c'});
        setAndFlush({b:'d'});
        expect(spy1).to.have.been.calledTwice
          .and.calledWith(snapVal('a', null, 'a'))
          .and.calledWith(snapVal('c', null, 'c'));
      });

      it('are not called when added to node with initialized value', function () {
        setAndFlush({a:'a'});
        node.on('child_removed', spy1);
        expect(spy1.called).to.equal(false);
      });
    });
  });

  describe('#key ', function(){
    it('contains the key passed to constructor',function(){
      node = new TreeNode('a');
      expect(node.key()).to.equal('a');
    });
  });

  describe('#child(path, [create]) ', function(){
    it('will return null if no child exists', function(){
      node.setValue({a:'a'});
      expect(node.child('b')).to.equal(null);
    });

    it('will return the child if one exists', function(){
      node.setValue({a:'a'});
      expect(node.child('a')).to.be.an.instanceOf(TreeNode);
      expect(node.child('a').key()).to.equal('a');
    });

    it('will return a deep child', function(){
      node.setValue({a:{b:'c'}});
      expect(node.child('a/b')).to.be.an.instanceOf(TreeNode);
      expect(node.child('a/b').key()).to.equal('b');
    });

    it('will create a child even if one does not exist', function(){
      node.setValue({a:'a'});
      expect(node.child('b')).to.equal(null);
      expect(node.child('b',true)).to.be.an.instanceOf(TreeNode);
    });

    it('returns the same node each time',function(){
      node.setValue({a:'a'});
      expect(node.child('a',true)).to.equal(node.child('a'));
      expect(node.child('b',true)).to.equal(node.child('b')).and.to.not.equal(null);
    });
  });
});