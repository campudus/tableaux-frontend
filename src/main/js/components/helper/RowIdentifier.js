var _ = require('lodash');

// No conflict with same object name
var private = {

  getColumnByConcatIndex : function (cell, concatIndex) {
    var columns = cell.tables.get(cell.tableId).columns;
    var concatColumnId = columns.at(0).concats[concatIndex];
    return columns.get(concatColumnId);
  },

  appendValue : function (string, toAppend) {
    //If is String... can be deleted after development because check is already being made in calling function
    if (_.isString(toAppend) || _.isNumber(toAppend)) {
      if (string && string !== "") {
        string += ", " + toAppend;
      } else {
        string = toAppend;
      }
    } else {
      console.error("toAppend is not a string or number: ", toAppend, " Check IdentifierCell");
    }
    return string;
  },

  getIdCellByOtherCell : function (cell) {
    var currentTableId = cell.tableId;
    var currentTable = cell.tables.get(currentTableId);
    var currentRow = currentTable.rows.get(cell.rowId);
    var idCell = currentRow.cells[0];

    console.log("--------------------------------");
    console.log("currentTable:", currentTable);
    console.log("currentRow:", currentRow);
    console.log("idCell:", idCell);
    console.log("--------------------------------");

    return idCell;

  },

  getRowIdentifierFromText : function (cell, langtag) {
    var value = "";
    console.log("getRowIdentifierFromText cell:", cell);
    if (cell.isMultiLanguage) {
      console.log("is multilang ?", cell);
      value = cell.value[langtag];
    } else {
      value = cell.value;
    }
    return value;
  }

};

var RowIdentifier = {

  //getRowIdentifierByRow
  getRowIdentifierByRow : function (row, langtag) {
    return this.getRowIdentifierByCell(row.cells[0], langtag);
  },

  getRowIdentifierByOtherCell : function (cell, langtag) {
    var currentTableId = cell.tableId;
    var currentTable = cell.tables.get(currentTableId);
    var currentRow = currentTable.rows.get(cell.rowId);
    var idCell = currentRow.cells[0];
    return this.getRowIdentifierByCell(idCell, langtag);
  },

  getRowIdentifierByCell : function (cell, langtag) {
    var concatVal = null;

    if (cell.kind === "shorttext" || cell.kind === "text") {
      return private.getRowIdentifierFromText(cell, langtag);
    } else if (cell.kind !== "concat") {
      console.error("cell is not kind concat. Check RowIdentifier.getRowIdentifierByCell()");
    }

    if (!cell) {
      return "";
    }

    _.forEach(cell.value, function (value, index) {

      var column = private.getColumnByConcatIndex(cell, index);
      var isMultilanguage = column.multilanguage;
      var isLink = column.isLink;

      if (isMultilanguage && _.isObject(value)) {
        //multilanguage
        if (!_.isEmpty(value)) {
          if (!_.isUndefined(value[langtag])) {
            concatVal = private.appendValue(concatVal, value[langtag]);
          }
        }

      } else if (isLink && _.isArray(value)) {
        //link

        _.forEach(value, function (arrayVal, arrayKey) {
          //multilanguage object
          if (_.isObject(arrayVal)) {

          }

          else {
            //single value

          }

        });

      } else if (_.isString(value) || _.isNumber(value)) {
        concatVal = private.appendValue(concatVal, value);
      } else if (!_.isNull(value) && !_.isUndefined(value)) {
        console.error("Unknown identifier type:", value, ". Check RowIdentifier");
      }

    });
    return concatVal || "";
  }

};

module.exports = RowIdentifier;