var AmpersandModel = require('ampersand-model');
var apiUrl = require('../apiUrl');

var Cell = AmpersandModel.extend({
  props : {
    tableId : 'number',
    colId : 'number',
    rowId : 'number',
    value : 'any',
    isEditing : 'boolean'
  },

  toJSON : function () {
    console.log('serializing cell', this);
    return {cells : [this.attributes]};
  },

  url : function () {
    var url = apiUrl('/tables/' + this.tableId + '/columns/' + this.colId + '/rows/' + this.rowId);
    console.log('get url from cell', url);
    return url;
  },

  parse : function (resp, options) {
    if (!(options && options.parse)) {
      return this;
    } else {
      return resp.rows[0];
    }
  }
});

module.exports = Cell;
