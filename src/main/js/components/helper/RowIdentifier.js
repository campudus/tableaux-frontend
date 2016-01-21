var _ = require('lodash');
var Moment = require('moment');
var App = require('ampersand-app');

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
    if (cell.isMultiLanguage) {
      value = cell.value[langtag];
    } else {
      value = cell.value;
    }
    return value;
  },

  getRowIdentifierFromLink : function (cell, langtag) {
    console.log("getRowIdentifierFromLink. cell:", cell);
    //return private.getRowIdentifierFromConcat(cell, langtag);

  },

  //TODO: Needs refactor: check kinds and get multilanguage or single language values better!
  getRowIdentifierFromConcat : function (cell, langtag) {

    var concatVal = null;

    _.forEach(cell.value, function (value, index) {

      //The column the concat cell points to
      var column = private.getColumnByConcatIndex(cell, index);
      var isMultilanguage = column.multilanguage;
      var isLink = column.isLink;
      var isBoolean = column.kind === "boolean";
      var isDateTime = column.kind === "datetime";

      //TODO: Check all kinds explicitly: Multilanguage boolean could true this if.
      if (isDateTime && !_.isEmpty(value)) {
        //datetime
        var formattedVal = "";
        if (isMultilanguage) {
          if (!_.isEmpty(value[langtag])) {
            formattedVal = Moment(value[langtag], App.dateTimeFormats.formatForServer).format(App.dateTimeFormats.formatForUser);
          }
        } else {
          formattedVal = Moment(value, App.dateTimeFormats.formatForServer).format(App.dateTimeFormats.formatForUser);
        }

        concatVal = private.appendValue(concatVal, formattedVal);
      } else if (isMultilanguage && _.isObject(value)) {
        //multilanguage text

        if (!_.isEmpty(value)) {
          if (!_.isUndefined(value[langtag])) {
            concatVal = private.appendValue(concatVal, value[langtag]);
          }
        }

      } else if (isLink && _.isArray(value)) {
        //link

        _.forEach(value, function (arrayVal, arrayKey) {

          //multilanguage link object
          if (_.isObject(arrayVal)) {
            if (isMultilanguage) {
              console.log("is multilanguage link");
              concatVal = private.appendValue(concatVal, arrayVal.value[langtag]);
            } else {
              concatVal = private.appendValue(concatVal, arrayVal.value);
            }

          }

          else {
            //single value
            concatVal = private.appendValue(concatVal, arrayVal.value);
          }

        });

      } else if (_.isString(value) || _.isNumber(value)) {
        concatVal = private.appendValue(concatVal, value);
      } else if (isBoolean) {
        //boolean
        concatVal = private.appendValue(concatVal, column.name + ": " + (value ? "Yes" : "No"));
      }
      else if (!_.isNull(value) && !_.isUndefined(value)) {
        console.error("Unknown identifier kind:", column.kind, ",value:", value, ". Check RowIdentifier.");
      }

    });

    return concatVal;
  }

};

var RowIdentifier = {

  //getRowIdentifierByRow
  getRowIdentifierByRow : function (row, langtag) {
    if (row) {
      return this.getRowIdentifierByCell(row.cells[0], langtag);
    } else {
      console.log("RowIdentifier.getRowIdentifierByRow: row is null.");
    }

  },

  getRowIdentifierByOtherCell : function (cell, langtag) {
    var currentTableId = cell.tableId;
    var currentTable = cell.tables.get(currentTableId);
    var currentRow = currentTable.rows.get(cell.rowId);
    var idCell = currentRow.cells[0];
    return this.getRowIdentifierByCell(idCell, langtag);
  },

  getRowIdentifierByCell : function (cell, langtag) {
    if (!cell) {
      return "";
    } else if (cell.kind === "shorttext" || cell.kind === "text") {
      return private.getRowIdentifierFromText(cell, langtag);
    } else if (cell.kind === "concat") {
      return private.getRowIdentifierFromConcat(cell, langtag);
    } else if (cell.kind === "link") {
      return private.getRowIdentifierFromLink(cell, langtag);
    } else {
      console.error("cell identifier is unknown kind:", cell.kind, ". Check RowIdentifier.getRowIdentifierByCell(). Cell Object:", cell);
      return "";
    }
  }

};

module.exports = RowIdentifier;