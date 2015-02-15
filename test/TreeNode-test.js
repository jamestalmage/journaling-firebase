describe('TreeNode',function(){

  // Assertion Framework
  var chai = require('chai');
  var expect = chai.expect;

  var sinon = require('sinon');
  chai.use(require('sinon-chai'));


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
        node.setValue('foo');
        node.flushChanges();
        expect(node.initialized).to.equal(true);
      });

      it('boolean',function(){
        node.setValue(false);
        node.flushChanges();
        expect(node.initialized).to.equal(true);
      });

      it('number',function(){
        node.setValue(3);
        node.flushChanges();
        expect(node.initialized).to.equal(true);
      });

      it('null',function(){
        node.setValue(null);
        node.flushChanges();
        expect(node.initialized).to.equal(true);
      });

      it('object', function(){
        node.setValue({a:'b'});
        node.flushChanges();
        expect(node.initialized).to.equal(true);
      });
    });
  });

  describe('#on() ',function(){
    describe('"value" listeners ',function(){
      it('are not called if setValue has never been called',function(){
        node.on('value',spy1);
        node.flushChanges();
        expect(spy1).not.to.have.been.called;
      });

      it('is called if setValue was initially set to null',function(){
        node.on('value',spy1);
        node.setValue(null);
        node.flushChanges();
        expect(spy1).to.have.been.called;
      });

      it('are called when value changes', function(){
        node.on('value',spy1);
        node.setValue(true);
        expect(spy1).not.to.have.been.called;
        node.flushChanges();
        expect(spy1).to.have.been.called;
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

      it('are called immediately when value has already been set', function(){
        node.setValue('foo');
        node.flushChanges();
        node.on('value',spy1);
        expect(spy1.called).to.equal(true);
      });

      describe('on child nodes',function(){
        it('are called when the child\'s value changes' ,function(){
          node.setValue({a:'a'});
          node.child('a').on('value',spy1);
          node.flushChanges();
          spy1.reset();
          node.setValue({a:'b'});
          node.flushChanges();
          expect(spy1.called).to.equal(true);
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
          expect(spy1.called).to.equal(true);
        });
      });
    });
  });

  describe('#key ',function(){
    it('contains the key passed to constructor',function(){
      node = new TreeNode('a');
      expect(node.key).to.equal('a');
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
      expect(node.child('a').key).to.equal('a');
    });

    it('will return a deep child', function(){
      node.setValue({a:{b:'c'}});
      expect(node.child('a/b')).to.be.an.instanceOf(TreeNode);
      expect(node.child('a/b').key).to.equal('b');
    });

    it('will create a child even if one does not exist', function(){
      node.setValue({a:'a'});
      expect(node.child('b')).to.equal(null);
      expect(node.child('b',true)).to.be.an.instanceOf(TreeNode);
    });

    it('returns the same node each time',function(){
      node.setValue({a:'a'});
      expect(node.child('a')).to.equal(node.child('a'));
      expect(node.child('b',true)).to.equal(node.child('b')).and.to.not.equal(null);
    });
  });


});