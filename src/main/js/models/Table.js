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

  }

});

module.exports = Table;
