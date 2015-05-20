var AmpersandModel = require('ampersand-model');
var sync = require('ampersand-sync');
var apiUrl = require('../apiUrl');

var Cell = AmpersandModel.extend({
  props : {
    tableId : 'number',
    colId : 'number',
    rowId : 'number',
    value : 'any',
    isEditing : 'boolean'
  },

  serialize : function () {
    var result = AmpersandModel.prototype.serialize.apply(this, arguments);
    delete result.isEditing;
    return {cells : [result]};
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
