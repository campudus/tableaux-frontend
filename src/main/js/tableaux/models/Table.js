var Model = require('ampersand-model');
var Columns = require('./Columns');
var Rows = require('./Rows');
var Row = require('./Row');
var Dispatcher = require('../Dispatcher');

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
      var newRow = new Row();
      self.rows.add(newRow);
      newRow.save({
        success : function () {
          console.log('added new row!');
        },
        error : function (err) {
          console.log('could not add new row!');
          self.rows.add(newRow);
        }
      });
    });
  }
});

module.exports = Table;
