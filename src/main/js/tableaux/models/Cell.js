var AmpersandModel = require('ampersand-model');
var Dispatcher = require('../Dispatcher');
var sync = require('ampersand-sync');
var apiUrl = require('../apiUrl');

var Cell = AmpersandModel.extend({
  props : {
    tableId : 'number',
    colId : 'number',
    rowId : 'number',
    value : 'any'
  },

  session : {
    isEditing : ['boolean', true, false]
  },

  initialize : function () {
    Dispatcher.on('change-cell:' + this.tableId + ':' + this.colId + ':' + this.rowId, this.changeCell.bind(this));
  },

  destroy : function() {
    Dispatcher.off('change-cell:' + this.tableId + ':' + this.colId + ':' + this.rowId, this.changeCell);
  },

  changeCell : function (event) {
    if (this.value !== event.newValue) {
      this.value = event.newValue;
      this.save(this, {
        parse : false,
        success : function () {
          console.log('saved successfully');
        },
        error : function () {
          console.log('save unsuccessful!');
        }
      });
    }
  },

  serialize : function () {
    var result = AmpersandModel.prototype.serialize.apply(this, arguments);
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
