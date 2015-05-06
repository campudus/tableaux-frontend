describe('TableauxStore', function () {
  var TableauxStore = require('../main/js/tableaux/TableauxStore');
  var store;

  beforeEach(function () {
    store = new TableauxStore();
  });

  it('should be possible to fetch some data', function (done) {
    console.log('got a TableauxStore', store);
    store.fetch({
      success : function (data) {
        console.log('got something?!', data);
      },
      error : function (err) {
        console.log('error, error, error!', err);
      }
    })
      .done(function (data) {
        console.log('got some data', data);
        expect(data).not.toBeNull();
        done();
      })
      .error(function (err) {
        console.log('got an error', err);
        console.log('got an error', arguments);
        fail('should not happen');
        done();
      });
  });

});
