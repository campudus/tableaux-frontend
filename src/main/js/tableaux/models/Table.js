var Model = require('ampersand-model');
var Columns = require('./Columns');
var Rows = require('./Rows');
var Row = require('./Row');
var Dispatcher = require('../Dispatcher');
var request = require('superagent');

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

    this.rows.on('remove', function (model, collection, options) {
      console.log('remove model', model);
    });

    Dispatcher.on('add-row:' + this.getId(), function () {
      var newRow = new Row({tableId : self.getId()});

      newRow.save({}, {
        success : function (savedRow) {
          console.log('added new row!', arguments);

          Dispatcher.trigger('added-row:' + self.getId());

          self.rows.getOrFetch(savedRow.id);
        },
        error : function (err) {
          console.err('could not add new row!', err, arguments);

          Dispatcher.trigger('added-row:' + self.getId());
        }
      });
    });
  }
});

module.exports = Table;
