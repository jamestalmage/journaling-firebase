describe('URI',function(){
  'use strict';

  var URI = require('../src/URI');

  var expect = require('chai').expect;

  describe('constructor', function(){
    it('accepts a string',function(){
      expect(new URI('https://something.com/test').toString()).to.equal('https://something.com/test');
    });

    it('accepts an array of strings',function(){
      var uri1 = 'https://something.com/test';
      expect(new URI(uri1.split('/')).toString()).to.equal(uri1);
      //expect(new URI(['https:',/*'',*/ 'something.com', 'test']).toString()).to.equal('https://something.com/test');
    });

    it('should make a defensive copy of the array (i.e. not manipulate the input array when trimming)',function(){
      var uri2 = 'https://something.com/test/';
      var input = uri2.split('/');
      expect(new URI(input).toString()).to.equal('https://something.com/test');
      expect(input.join('/')).to.equal(uri2);
    });

    it('accepts another URI',function(){
      expect(new URI(new URI('https://something.com/test')).toString()).to.equal('https://something.com/test');
    });

    it('throws on bad input',function(){
      expect(function(){
        new URI(3);
      }).to.throw();
    });
  });

  it('#key - contains the key (i.e. last element of the path)',function(){
    expect(new URI('https://something.com/test').key).to.equal('test');
    expect(new URI('https://something.com/test2').key).to.equal('test2');
    expect(new URI('https://something.com/test3/').key).to.equal('test3');
    expect(new URI('https://something.com/a/test4/').key).to.equal('test4');
    expect(new URI('https://something.com/').key).to.equal(null);
    expect(new URI('https://something.com').key).to.equal(null);
  });

  it('#parent - contains a URI instance for the parent path',function(){
    expect(new URI('https://something.com/test').parent.toString()).to.equal('https://something.com');
    expect(new URI('https://blah.com/test2').parent.toString()).to.equal('https://blah.com');
    expect(new URI('https://something.com/test3/').parent.toString()).to.equal('https://something.com');
    expect(new URI('https://something.com/').parent).to.equal(null);
    expect(new URI('https://something.com').parent).to.equal(null);
  });

  it('#protocol - contains the protocol',function(){
    expect(new URI('https://something.com/test').protocol).to.equal('https:');
    expect(new URI('http://something.com/').protocol).to.equal('http:');
  });

  it('#host - contains the host',function(){
    expect(new URI('https://something.com/test').host).to.equal('something.com');
    expect(new URI('https://somewhere.com/').host).to.equal('somewhere.com');
  });

  it('#uri - contains the uri string',function(){
    expect(new URI('https://something.com/test').uri).to.equal('https://something.com/test');
    expect(new URI('https://blah.com/test2').uri).to.equal('https://blah.com/test2');
    expect(new URI('https://something.com').uri).to.equal('https://something.com');
  });

  it('#toString - returns the uri string',function(){
    expect(new URI('https://something.com/test').toString()).to.equal('https://something.com/test');
    expect(new URI('https://blah.com/test2').toString()).to.equal('https://blah.com/test2');
    expect(new URI('https://something.com').toString()).to.equal('https://something.com');
  });

  it('trims trailing "/" from the path',function(){
    expect(new URI('https://something.com/test3/').uri).to.equal('https://something.com/test3');
    expect(new URI('https://something.com/').uri).to.equal('https://something.com');
    expect(new URI('https://something.com/test3/').toString()).to.equal('https://something.com/test3');
    expect(new URI('https://something.com/').toString()).to.equal('https://something.com');
  });

  describe('#child',function(){
    it('(string) returns a URI representing the child path',function(){
      expect(new URI('https://something.com/test').child('a/b').uri).to.equal('https://something.com/test/a/b');
    });

    it('(string[]) returns a URI representing the child path',function(){
      expect(new URI('https://something.com/test/').child('c/d/').uri).to.equal('https://something.com/test/c/d');
    });

    it('will trim trailing "/" from the path',function(){
      expect(new URI('https://something.com/test/').child(['e','f']).uri).to.equal('https://something.com/test/e/f');
    });
  });

  describe('#isChild',function(){
    var uri = new URI('https://something.com/test/a');

    describe('returns true',function(){
      it('for strings describing child paths',function(){
        expect(uri.isChild('https://something.com/test/a/b')).to.equal(true);
        expect(uri.isChild('https://something.com/test/a/c')).to.equal(true);
      });

      it('for arrays describing child paths',function(){
        expect(uri.isChild('https://something.com/test/a/b'.split('/'))).to.equal(true);
        expect(uri.isChild('https://something.com/test/a/b/'.split('/'))).to.equal(true);
        expect(uri.isChild('https://something.com/test/a/c'.split('/'))).to.equal(true);
        expect(uri.isChild('https://something.com/test/a/c/'.split('/'))).to.equal(true);
      });

      it('for URI instances describing child paths',function(){
        expect(uri.isChild(new URI('https://something.com/test/a/b'))).to.equal(true);
        expect(uri.isChild(new URI('https://something.com/test/a/c'))).to.equal(true);
      });
    });

    describe('returns false',function(){
      it('for strings describing parent paths',function(){
        expect(uri.isChild('https://something.com/')).to.equal(false);
        expect(uri.isChild('https://something.com/test')).to.equal(false);
      });

      it('for arrays describing parent paths',function(){
        expect(uri.isChild('https://something.com/'.split('/'))).to.equal(false);
        expect(uri.isChild('https://something.com/test'.split('/'))).to.equal(false);
      });

      it('for URI instances describing parent paths',function(){
        expect(uri.isChild(new URI('https://something.com/'))).to.equal(false);
        expect(uri.isChild(new URI('https://something.com/test'))).to.equal(false);
      });

      it('for strings describing the same path',function(){
        expect(uri.isChild('https://something.com/test/a')).to.equal(false);
        expect(uri.isChild('https://something.com/test/a/')).to.equal(false);
      });

      it('for arrays describing the same path',function(){
        expect(uri.isChild('https://something.com/test/a'.split('/'))).to.equal(false);
        expect(uri.isChild('https://something.com/test/a/'.split('/'))).to.equal(false);
      });

      it('for URI instances describing the same path',function(){
        expect(uri.isChild(new URI('https://something.com/test/a'))).to.equal(false);
        expect(uri.isChild(new URI('https://something.com/test/a/'))).to.equal(false);
      });
    });

    it('throws an error on invalid path argument',function(){
       expect(function(){
         uri.isChild(3);
       }).to.throw();
    });
  });


  describe('#isParent',function(){
    var uri = new URI('https://something.com/test/a');

    describe('returns false',function(){
      it('for strings describing child paths',function(){
        expect(uri.isParent('https://something.com/test/a/b')).to.equal(false);
        expect(uri.isParent('https://something.com/test/a/c')).to.equal(false);
      });

      it('for arrays describing child paths',function(){
        expect(uri.isParent('https://something.com/test/a/b'.split('/'))).to.equal(false);
        expect(uri.isParent('https://something.com/test/a/b/'.split('/'))).to.equal(false);
        expect(uri.isParent('https://something.com/test/a/c'.split('/'))).to.equal(false);
        expect(uri.isParent('https://something.com/test/a/c/'.split('/'))).to.equal(false);
      });

      it('for URI instances describing child paths',function(){
        expect(uri.isParent(new URI('https://something.com/test/a/b'))).to.equal(false);
        expect(uri.isParent(new URI('https://something.com/test/a/c'))).to.equal(false);
      });

      it('for strings describing the same path',function(){
        expect(uri.isParent('https://something.com/test/a')).to.equal(false);
        expect(uri.isParent('https://something.com/test/a/')).to.equal(false);
      });

      it('for arrays describing the same path',function(){
        expect(uri.isParent('https://something.com/test/a'.split('/'))).to.equal(false);
        expect(uri.isParent('https://something.com/test/a/'.split('/'))).to.equal(false);
      });

      it('for URI instances describing the same path',function(){
        expect(uri.isParent(new URI('https://something.com/test/a'))).to.equal(false);
        expect(uri.isParent(new URI('https://something.com/test/a/'))).to.equal(false);
      });
    });

    describe('returns true',function(){
      it('for strings describing parent paths',function(){
        expect(uri.isParent('https://something.com/')).to.equal(true);
        expect(uri.isParent('https://something.com/test')).to.equal(true);
      });

      it('for arrays describing parent paths',function(){
        expect(uri.isParent('https://something.com/'.split('/'))).to.equal(true);
        expect(uri.isParent('https://something.com/test'.split('/'))).to.equal(true);
      });

      it('for URI instances describing parent paths',function(){
        expect(uri.isParent(new URI('https://something.com/'))).to.equal(true);
        expect(uri.isParent(new URI('https://something.com/test'))).to.equal(true);
      });
    });

    it('throws an error on invalid path argument',function(){
      expect(function(){
        uri.isParent(3);
      }).to.throw();
    });
  });
});

