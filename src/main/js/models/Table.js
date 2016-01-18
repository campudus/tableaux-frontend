var Model = require('ampersand-model');
var Dispatcher = require('../dispatcher/Dispatcher');

var Columns = require('./Columns');
var Rows = require('./Rows');
var Row = require('./Row');

var Table = Model.extend({
  props : {
    id : 'number',
    name : 'string'
  },

  collections : {
    columns : Columns,
    rows : Rows
  },

  initialize : function () {
    var self = this;

    Dispatcher.on('add-row:' + this.getId(), function (callbackFn) {
      var newRow = new Row({tableId : self.getId()});

      newRow.save({}, {
        success : function (savedRow) {
          self.rows.getOrFetch(savedRow.id, function (error) {
            if (error) {
              console.error("Error getOrFetch: ", error);
            } else {
              callbackFn(); // no error
            }
          });
        },
        error : function (err) {
          console.error('could not add new row!', err, arguments);
          callbackFn(err);
        }
      });
    });
  }
});

module.exports = Table;
