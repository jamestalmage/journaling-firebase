'use strict';
describe('FlushQueue',function(){
  //region Initialization

  // ASSERTION FRAMEWORK
  var chai = require('chai');
  var expect = chai.expect;
  var sinon = require('sinon');
  chai.use(require('sinon-chai'));


  // CLASS UNDER TEST
  var FlushQueue = require('../src/FlushQueue');


  // SETUP
  var queue, obj1, obj2, obj3, spy1, spy2, spy3;

  function makeObj(){
    return {
      spy1:sinon.spy(),
      spy2:sinon.spy(),
      spy3:sinon.spy()
    };
  }

  beforeEach(function(){
    queue = new FlushQueue();
    spy1 = sinon.spy();
    spy2 = sinon.spy();
    spy3 = sinon.spy();
    obj1 = makeObj();
    obj2 = makeObj();
    obj3 = makeObj();
  });
  //endregion

  //TESTS
  it('will call callback if it has been scheduled', function(){
    var reg = queue.registration(obj1,'spy1');
    reg.schedule();
    queue.flush();
    expect(obj1.spy1).to.have.been.calledOnce.and.calledOn(obj1);
  });

  it('will not call callback if it has not been scheduled', function(){
    var reg = queue.registration(obj1,'spy1');
    queue.flush();
    expect(obj1.spy1.called).to.equal(false);
  });

  it('will only call scheduled callbacks', function(){
    var reg1 = queue.registration(obj1, 'spy1');
    var reg2 = queue.registration(obj1, 'spy2');
    var reg3 = queue.registration(obj3, 'spy3');
    reg1.schedule();
    reg2.schedule();

    queue.flush();

    expect(obj1.spy1).to.have.been.calledOnce.and.calledOn(obj1);
    expect(obj1.spy2).to.have.been.calledOnce.and.calledOn(obj1);
    expect(obj1.spy3.called).to.equal(false);
  });

  it('cancel() the middle callback', function(){
    var reg1 = queue.registration(obj1, 'spy1');
    var reg2 = queue.registration(obj2, 'spy2');
    var reg3 = queue.registration(obj3, 'spy3');
    reg1.schedule();
    reg2.schedule();
    reg3.schedule();
    reg2.cancel();

    queue.flush();

    expect(obj1.spy1).to.have.been.calledOnce.and.calledOn(obj1);
    expect(obj2.spy2.called).to.equal(false);
    expect(obj3.spy3).to.have.been.calledOnce.and.calledOn(obj3);
  });

  it('callbacks can be specified as actual functions',function(){
    var reg1 = queue.registration(obj1, spy1);
    reg1.schedule();
    queue.flush();

    expect(spy1).to.have.been.calledOnce.and.calledOn(obj1);
  });

  it('will throw if it can not find the callback', function(){
    expect(function(){
      queue.registration(obj1,'spy5');
    }).to.throw();
  });

  it('will not schedule twice', function(){
    var reg1 = queue.registration(obj1, 'spy1');
    reg1.schedule();
    reg1.schedule();
    queue.flush();
    expect(obj1.spy1).to.have.been.calledOnce.and.calledOn(obj1);
  });

  it('will be unscheduled after flush', function(){
    var reg1 = queue.registration(obj1, 'spy1');
    reg1.schedule();
    queue.flush();
    obj1.spy1.reset();
    queue.flush();
    expect(obj1.spy1.called).to.equal(false);
  });

  it('can be cancelled', function(){
    var reg1 = queue.registration(obj1, 'spy1');
    reg1.schedule();
    reg1.cancel();
    queue.flush();
    expect(obj1.spy1.called).to.equal(false);
  });

  it('can be double cancelled', function(){
    var reg1 = queue.registration(obj1, 'spy1');
    reg1.schedule();
    reg1.cancel();
    reg1.cancel();
    queue.flush();
    expect(obj1.spy1.called).to.equal(false);
  });

  it('can be cancelled without ever being scheduled', function(){
    var reg1 = queue.registration(obj1, 'spy1');
    reg1.cancel();
    queue.flush();
    expect(obj1.spy1.called).to.equal(false);
  });

  it('clear will cancel all pending flushes', function(){
    var reg1 = queue.registration(obj1, 'spy1');
    var reg2 = queue.registration(obj1, 'spy2');
    reg1.schedule();
    reg2.schedule();

    queue.clear();
    queue.flush();

    expect(obj1.spy1.called).to.equal(false);
    expect(obj1.spy2.called).to.equal(false);
  });

  describe('child registrations', function(){
    it('scheduling on the child queue also causes child listener to be called on flush', function(){
      var queue2 = queue.childRegistration(obj1, 'spy1');
      var reg = queue2.registration(obj2, 'spy2');
      reg.schedule();
      queue.flush();
      expect(obj1.spy1).to.have.been.calledOnce.and.calledOn(obj1);
      expect(obj2.spy2).to.have.been.calledOnce.and.calledOn(obj2);
    });

    it('nothing gets called if nothing gets scheduled', function(){
      var queue2 = queue.childRegistration(obj1, 'spy1');
      var reg = queue2.registration(obj2, 'spy2');
      queue.flush();
      expect(obj1.spy1.called).to.equal(false);
      expect(obj2.spy2.called).to.equal(false);
    });

    it('long chain', function(){
      var queue2 = queue.childRegistration(obj1, 'spy1');
      var queue3 = queue2.childRegistration(obj2, 'spy2');
      var reg = queue3.childRegistration(obj3, 'spy3');
      reg.schedule();
      queue.flush();
      expect(obj1.spy1).to.have.been.calledOnce.and.calledOn(obj1);
      expect(obj2.spy2).to.have.been.calledOnce.and.calledOn(obj2);
      expect(obj3.spy3).to.have.been.calledOnce.and.calledOn(obj3);
    });

    it('cancelling all the scheduled children will prevent all calls', function(){
      var queu2 = queue.childRegistration(obj1, 'spy1');
      var reg1 = queu2.registration(obj2, 'spy2');
      var reg2 = queu2.registration(obj3, 'spy3');
      reg1.schedule();
      reg2.schedule();
      reg1.cancel();
      reg2.cancel();
      queue.flush();
      expect(obj1.spy1.called).to.equal(false);
      expect(obj2.spy2.called).to.equal(false);
      expect(obj3.spy3.called).to.equal(false);
    });

    it('cancelling only some the scheduled children', function(){
      var queu2 = queue.childRegistration(obj1, 'spy1');
      var reg1 = queu2.registration(obj2, 'spy2');
      var reg2 = queu2.registration(obj3, 'spy3');
      reg1.schedule();
      reg2.schedule();
      reg2.cancel();
      queue.flush();
      expect(obj1.spy1).to.have.been.calledOnce.and.calledOn(obj1);
      expect(obj2.spy2).to.have.been.calledOnce.and.calledOn(obj2);
      expect(obj3.spy3.called).to.equal(false);
    });

    it('cancelling all children will not cancel queue action if it was explicitly scheduled', function(){
      var queu2 = queue.childRegistration(obj1, 'spy1');
      var reg1 = queu2.registration(obj2, 'spy2');
      var reg2 = queu2.registration(obj3, 'spy3');
      queu2.schedule();
      reg1.schedule();
      reg2.schedule();
      reg1.cancel();
      reg2.cancel();
      queue.flush();
      expect(obj1.spy1).to.have.been.calledOnce.and.calledOn(obj1);
      expect(obj2.spy2.called).to.equal(false);
      expect(obj3.spy3.called).to.equal(false);
    });

    it('explicitly cancelling without cancelling children will not prevent execution', function(){
      var queu2 = queue.childRegistration(obj1, 'spy1');
      var reg1 = queu2.registration(obj2, 'spy2');
      var reg2 = queu2.registration(obj3, 'spy3');
      queu2.schedule();
      reg1.schedule();
      reg2.schedule();
      reg1.cancel();
      queu2.cancel();
      queue.flush();
      expect(obj1.spy1).to.have.been.calledOnce.and.calledOn(obj1);
      expect(obj2.spy2.called).to.equal(false);
      expect(obj3.spy3).to.have.been.calledOnce.and.calledOn(obj3);
    });

    it('clear will cancel all pending flushes and cancel with parent if not explicitly scheduled', function(){
      var queu2 = queue.childRegistration(obj1, 'spy1');
      var reg1 = queu2.registration(obj2, 'spy2');
      var reg2 = queu2.registration(obj3, 'spy3');
      reg1.schedule();
      reg2.schedule();
      queu2.clear();
      queue.flush();
      expect(obj1.spy1.called).to.equal(false);
      expect(obj2.spy2.called).to.equal(false);
      expect(obj3.spy3.called).to.equal(false);
    });

    it('clear will cancel all pending flushes but not cancel with parent if explicitly scheduled', function(){
      var queu2 = queue.childRegistration(obj1, 'spy1');
      var reg1 = queu2.registration(obj2, 'spy2');
      var reg2 = queu2.registration(obj3, 'spy3');
      queu2.schedule();
      reg1.schedule();
      reg2.schedule();
      queu2.clear();
      queue.flush();
      expect(obj1.spy1).to.have.been.calledOnce.and.calledOn(obj1);
      expect(obj2.spy2.called).to.equal(false);
      expect(obj3.spy3.called).to.equal(false);
    });


    it('clear(true) will cancel all pending flushes and cancel with parent even if explicitly scheduled', function(){
      var queu2 = queue.childRegistration(obj1, 'spy1');
      var reg1 = queu2.registration(obj2, 'spy2');
      var reg2 = queu2.registration(obj3, 'spy3');
      queu2.schedule();
      reg1.schedule();
      reg2.schedule();
      queu2.clear(true);
      queue.flush();
      expect(obj1.spy1.called).to.equal(false);
      expect(obj2.spy2.called).to.equal(false);
      expect(obj3.spy3.called).to.equal(false);
    });
  });
});
