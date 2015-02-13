xdescribe('TreeNode',function(){

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

      it('null',function(){
        expect(node.setValue(null)).to.equal(true);
      });

      it('object',function(){
        expect(node.setValue({a:'a'})).to.equal(true);
      });
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

      it('key ordering',function(){
        expect(Object.keys({a:'a',b:'b'}).sort()).to.eql(Object.keys({b:'a',a:'b'}).sort())
      });

      xit('deeply unequal object',function(){
        node.setValue({a:'a'});
        node.flushChanges();
        expect(node.setValue({a:'a'})).to.equal(false);
      });
    });
  });

  describe('#isInitialized() ',function(){
    it('returns false before setValue is called',function(){
      node.flushChanges();
      expect(node.isInitialized()).to.equal(false);
    });

    describe('returns true once setValue is called with a ',function(){
      it('string',function(){
        node.setValue('foo');
        node.flushChanges();
        expect(node.isInitialized()).to.equal(true);
      });

      it('boolean',function(){
        node.setValue(false);
        node.flushChanges();
        expect(node.isInitialized()).to.equal(true);
      });

      it('number',function(){
        node.setValue(3);
        node.flushChanges();
        expect(node.isInitialized()).to.equal(true);
      });

      it('null',function(){
        node.setValue(null);
        node.flushChanges();
        expect(node.isInitialized()).to.equal(true);
      });
    });
  });

  describe('#on() ',function(){
    it('"value" events are called when value changes', function(){
      node.on('value',spy1);
      node.setValue(true);
      expect(spy1).not.to.have.been.called;
      node.flushChanges();
      expect(spy1).to.have.been.called;
    });

    it('"value" events are not called when setValue() does not change anything',function(){
      node.setValue('foo');
      node.on('value',spy1);
      node.flushChanges();
      spy1.reset();
      node.setValue('foo');
      node.flushChanges();
      expect(spy1).not.to.have.been.called;
    });
  });
});