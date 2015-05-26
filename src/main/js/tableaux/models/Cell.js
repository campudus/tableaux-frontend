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

  initialize : function (attrs, options) {
    console.log('init cell', this);
    var event = 'change-cell:' + this.tableId + ':' + this.colId + ':' + this.rowId;
    var self = this;
    self.changeCellListener = this.changeCell.bind(this);

    if (options && options.row) {
      Dispatcher.on(event, self.changeCellListener);

      options.row.once('remove', function () {
        Dispatcher.off(event, self.changeCellListener);
      });
    }
  },

  changeCell : function (event) {
    console.log('change event for cell', event);
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
    console.log('parsing cell', resp, options);
    if (!(options && options.parse)) {
      return this;
    } else if (resp.rows) {
      return resp.rows[0];
    } else {
      return resp;
    }
  }
});

module.exports = Cell;
