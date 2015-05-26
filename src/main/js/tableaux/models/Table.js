var Model = require('ampersand-model');
var Columns = require('./Columns');
var Rows = require('./Rows');

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
    this.rows.on('remove', function (model, collection, options) {
      console.log('remove model', model);
    });
  }
});

module.exports = Table;
