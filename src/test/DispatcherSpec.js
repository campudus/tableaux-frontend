describe('A dispatcher', function () {
  var dispatcher;

  beforeEach(function () {
    dispatcher = require('../main/js/tableaux/TableauxDispatcher');
  });

  it('should be able to register callbacks', function (done) {
    dispatcher.register('some-event', function () {
    });
    done();
  });

  it('should invoke registered callbacks', function (done) {
    dispatcher.register('some-event', function () {
      done();
    });

    dispatcher.emit('some-event');
  });

  it('should invoke all registered callbacks', function (done) {
    var count = 2;
    dispatcher.register('some-event', countDownDone);
    dispatcher.register('some-event', countDownDone);

    dispatcher.emit('some-event');

    function countDownDone() {
      count--;
      if (count === 0) {
        done();
      }
    }
  });

  it('should be possible to unregister callbacks', function (done) {
    var token = dispatcher.register('some-event', function () {
      fail('should not get here!');
    });
    dispatcher.unregister(token);

    dispatcher.emit('some-event');

    setTimeout(done, 10); // should be done
  });

  it('should only unregister the specific callback', function (done) {
    var count = 1;

    var token = dispatcher.register('some-event', function () {
      fail('should not get here!');
    });

    dispatcher.register('some-event', function () {
      count--;
    });

    dispatcher.unregister(token);

    dispatcher.emit('some-event');

    setTimeout(function () {
      if (count === 0) {
        done();
      } else {
        fail('should have called the other registered callback');
      }
    }, 10); // should be done
  });

  it('should be possible to add data to an event', function (done) {
    var payload = {
      text : 'hello',
      num : 1234
    };

    dispatcher.register('some-event', function (data) {
      expect(data.text).toEqual(payload.text);
      expect(data.num).toEqual(payload.num);
      expect(data).toEqual(payload);
      done();
    });
    dispatcher.emit('some-event', payload);
  });

});
