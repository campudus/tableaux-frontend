var AmpersandModel = require('ampersand-model');
var apiUrl = require('../apiUrl');

var Cell = AmpersandModel.extend({
  props : {
    tableId : 'number',
    colId : 'number',
    rowId : 'number',
    value : 'any'
  },

  url : function() {
    console.log('get url from cell', this);
    return apiUrl('/tables/' + this.tableId + '/columns/' + this.colId + '/rows/' + this.rowId);
  }
});

module.exports = Cell;
