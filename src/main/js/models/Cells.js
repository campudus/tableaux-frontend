const Collection = require("ampersand-collection");
const Cell = require("./Cell");

const Cells = Collection.extend({
  model: function (attrs, options) {
    const row = options.collection.parent;
    const rows = row.collection;
    const tables = rows.parent.collection;
    const tableId = rows.parent.getId();

    const json = {
      tables: tables,
      tableId: tableId,
      column: getColumn(rows, attrs.index),
      rowId: attrs.rowId,
      value: attrs.value,
      annotations: attrs.annotations,
      row: row
    };

    // console.log("creating Cell:", json);
    return new Cell(json, options);
  },

  isModel: function (model) {
    return model instanceof Cell;
  },

  comparator: false

});

function getColumn(rows, idx) {
  return rows.parent.columns.at(idx);
}

module.exports = Cells;
