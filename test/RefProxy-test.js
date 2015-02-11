describe('RefProxy',function(){
  var chai = require('chai');
  var expect = chai.expect;
  var makeRef = require('../src/RefProxy');
  var URI = require('../src/URI');
  var Ref = makeRef();


  var ref,root;
  beforeEach(function(){
    root = new Ref('https://somewhere.com/');
    ref = new Ref('https://somewhere.com/test/a');
  });

  describe('constructor',function(){
    it('accepts URI',function(){
      expect(new Ref(new URI('https://somewhere.com/test/a')).toString()).to.equal('https://somewhere.com/test/a');
    });

    it('accepts string',function(){
      expect(new Ref('https://somewhere.com/test/b').toString()).to.equal('https://somewhere.com/test/b');
    });

    it('accepts array',function(){
      expect(new Ref('https://somewhere.com/test/b'.split('/')).toString()).to.equal('https://somewhere.com/test/b');
    });
  });

  describe('#child',function(){
    it('creates a child reference',function(){
      expect(ref.child('b/c').toString()).to.equal('https://somewhere.com/test/a/b/c');
    });
  });

  describe('#parent',function(){
    it('creates a parent reference',function(){
      expect(ref.parent().toString()).to.equal('https://somewhere.com/test');
      expect(ref.parent().parent().toString()).to.equal('https://somewhere.com');
    });

    it('returns null if at root',function(){
      expect(root.parent()).to.equal(null);
    });
  });

  describe('#root',function(){
    it('creates a root reference',function(){
      expect(ref.root().toString()).to.equal('https://somewhere.com');
      expect(root.root().toString()).to.equal('https://somewhere.com');
    });
  });

  describe('#key',function(){
    it('returns the key',function(){
      expect(ref.key()).to.equal('a');
      expect(ref.parent().key()).to.equal('test');
    });
    it('returns null if at root',function(){
      expect(root.key()).to.equal(null);
    });
  });
  
  describe('#name',function(){
    it('returns the name',function(){
      expect(ref.name()).to.equal('a');
      expect(ref.parent().name()).to.equal('test');
    });
    it('returns null if at root',function(){
      expect(root.name()).to.equal(null);
    });
  });

});