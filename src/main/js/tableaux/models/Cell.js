var AmpersandModel = require('ampersand-model');
var Dispatcher = require('../Dispatcher');
var Column = require('./Column');
var sync = require('ampersand-sync');
var apiUrl = require('../apiUrl');

var Cell = AmpersandModel.extend({
  props : {
    tableId : 'number',
    column : Column,
    rowId : 'number',
    value : 'any'
  },

  session : {
    isEditing : ['boolean', true, false]
  },

  initialize : function (attrs, options) {
    var event = 'change-cell:' + this.tableId + ':' + this.column.getId() + ':' + this.rowId;
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

  url : function () {
    var url = apiUrl('/tables/' + this.tableId + '/columns/' + this.column.getId() + '/rows/' + this.rowId);
    return url;
  },

  toJSON : function () {
    var attrs = this.serialize();
    if (this.column.isLink) {
      var values = attrs.value.map(function (to) {
        return to.id;
      });
      delete attrs.value;
      attrs.value = {
        from : this.rowId,
        values : values
      };
    }
    return attrs;
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
