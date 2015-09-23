var AmpersandModel = require('ampersand-model');

var apiUrl = require('../helpers/apiUrl');

var Columns = require('./Columns');
var Cell = require('./Cell');

var Row = AmpersandModel.extend({
  props : {
    id : 'number'
  },

  session : {
    tableId : 'number',
    columns : Columns,
    values : 'array'
  },

  derived : {
    cells : {
      deps : ['values'],
      fn : function () {
        var self = this;
        return this.values.map(function (value, idx) {

          var json = {
            tables : self.collection.parent.collection,
            tableId : self.collection.parent.getId(),
            column : getColumn(idx),
            rowId : self.getId(),
            value : value
          };

          return new Cell(json, {row : self});
        });

        function getColumn(idx) {
          return self.collection.parent.columns.at(idx);
        }
      }
    }
  },

  serialize : function () {
    var ser = null;

    if (this.columns && this.values) {
      ser = {columns : this.columns, rows : [{values : this.values}]};
    }

    return ser;
  },

  toJSON : function () {
    var attrs = this.serialize();

    // check for a new and empty row
    if (attrs !== null) {
      return attrs;
    }
  },

  url : function () {
    var base = this.urlRoot();

    if (this.isNew()) {
      return base;
    } else {
      return base + '/' + this.getId();
    }
  },

  urlRoot : function () {
    // first try tableId because there could be a Row with out collection
    var tableId = this.tableId || this.collection.parent.getId();
    return apiUrl('/tables/' + tableId + '/rows');
  }
});

module.exports = Row;
