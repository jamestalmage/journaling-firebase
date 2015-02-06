describe('Composite',function(){

  var rewire = require('rewire');
  var MockFirebase = require('mockfirebase').MockFirebase;
  var Composite, Leaf, fb;
  var expect = require('chai').expect;


  beforeEach(function(){
    Composite = rewire('../src/Composite');
    Leaf = rewire('../src/Leaf');
    Leaf.__set__('Firebase', MockFirebase);
    Composite.__set__('Leaf',Leaf);
    fb = new MockFirebase('https://somewhere.com/test',data);
    var ct = 0;
    MockFirebase.setClock(function(){return ct++;});
  });

  var data = {
    composites:{
      compA:{
        a:'foo',
        b:'bar'
      }
    },
    leafStorage:{
      foo:{a:{value:'a'}},
      bar:{a:{value:'b'}}
    }
  };


  xit('blap',function(cb){
    fb.autoFlush(true);
    var compositeARef = fb.child('composites').child('compA');
    var storageRef = fb.child('leafStorage');
    var comp = new Composite(compositeARef,storageRef);
    var val;
    comp.on('value',function(snap){
      console.log('blah');
      val = snap.val();
      expect(val).to.eql({a:'a',b:'b'});
      cb();
    });
    //fb.flush();
    //fb.flush();


  });

});