describe('TableauxStore', function () {
  var TableauxStore = require('../main/js/tableaux/TableauxStore').store;
  var store;

  beforeEach(function () {
    store = new TableauxStore();
  });

  it('should be possible to fetch some data', function (done) {
    console.log('got a TableauxStore', store);
    store.fetch()
      .done(function (data) {
        console.log('got some data', data.tables);
        expect(data).not.toBeNull();
        done();
      })
      .error(function (err) {
        console.log('got an error', err);
        fail('should not happen');
        done();
      });
  });

});
