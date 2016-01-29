var Collection = require('ampersand-collection');
var _ = require('lodash');
var Cell = require('./Cell');

var Cells = Collection.extend({
  model : function (attrs, options) {
    var row = options.collection.parent;
    var rows = row.collection;
    var tables = rows.parent.collection;
    var tableId = rows.parent.getId();

    var json = {
      tables : tables,
      tableId : tableId,
      column : getColumn(rows, attrs.index),
      rowId : attrs.rowId,
      value : attrs.value
    };

    options.row = row;
    return new Cell(json, options);
  },

  isModel : function (model) {
    return model instanceof Cell;
  },

  comparator : false

});

function getColumn(rows, idx) {
  return rows.parent.columns.at(idx);
}

module.exports = Cells;
