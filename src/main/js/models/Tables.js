var Collection = require('ampersand-rest-collection');
var apiUrl = require('../helpers/apiUrl');
var Table = require('./Table');
var Dispatcher = require('../dispatcher/Dispatcher');
var ActionTypes = require('../constants/TableauxConstants').ActionTypes;
var ActionCreator = require('../actions/ActionCreator');
var Row = require('./Row');
var Cells = require('./Cells');
var Cell = require('./Cell');

var Tables = Collection.extend({
  model : Table,

  initialize : function () {
    console.log("Rows.initialize:", arguments);
    Dispatcher.on(ActionTypes.CHANGE_CELL, this.changeCellHandler, this);
    Dispatcher.on(ActionTypes.REMOVE_ROW, this.removeRowHandler, this);
    Dispatcher.on(ActionTypes.CREATE_ROW, this.addRowHandler, this);
    Dispatcher.on(ActionTypes.CLEANUP_TABLE, this.cleanupTable, this);
  },

  //Clear current/old collections to prevent reinitializing bugs and free memory
  cleanupTable : function (payload) {
    var tableId = payload.tableId;
    var tableToCleanUp = this.get(tableId);
    var rowsToCleanup = tableToCleanUp.rows;
    var columnsToCleanup = tableToCleanUp.columns;
    this.cleanUpRows(rowsToCleanup);
    columnsToCleanup.reset();
    ActionCreator.cleanupTableDone();
  },

  cleanUpRows : function (rowsToCleanup) {
    rowsToCleanup.forEach(function (row) {
      this.cleanUpRow(row);
    }, this);
    rowsToCleanup.reset();
  },

  cleanUpRow : function (rowToCleanup) {
    var cellsToCleanUp = rowToCleanup.cells;
    cellsToCleanUp.forEach(function (cell) {
      cell.cleanupCell();
    });
  },

  changeCellHandler : function (payload) {
    console.log("changeCellHandler:", payload);
    var self = this;

    var tableId = payload.tableId;
    var cellId = payload.cellId;
    var rowId = payload.rowId;

    var table = this.get(tableId);
    var row = table.rows.get(rowId);
    var cell = row.cells.get(cellId);
    var oldValue = cell.value;
    var newValue = payload.value; //value we send to the server
    var mergedValue; //The value we display for the user
    var updateNecessary = false;
    var isPatch = false;

    if (cell.isLink) {
      updateNecessary = !_.isEqual(oldValue, newValue);
      mergedValue = newValue;
    } else if (cell.isMultiLanguage) {
      mergedValue = _.assign({}, oldValue, newValue);
      newValue = {value : newValue};
      updateNecessary = !_.isEqual(oldValue, mergedValue);
      isPatch = true;
    } else {
      updateNecessary = !_.isEqual(oldValue, newValue);
      mergedValue = newValue;
      newValue = {value : newValue};
    }

    if (updateNecessary) {
      console.log("Cell Model: saving cell with value:", newValue);

      //we give direct feedback for user
      cell.value = mergedValue;
      self.updateConcatCells(cell);

      //we need to clear the newValue, otherwise ampersand save method is merging a strange object
      if (!isPatch) {
        newValue = null;
      }

      /*
       We want to wait to prevent flashes. We set the value explicitly before saving.
       Without wait:true save overrides the model for a short time with just one multilanguage value
       */
      cell.save(newValue, {
        patch : isPatch,
        wait : true,
        success : function (model, data, options) {
          //is there new data from the server?
          if (!_.isEqual(data.value, mergedValue)) {
            console.log('Cell model saved successfully. Server data changed meanwhile:', data.value, mergedValue);
            cell.value = data.value;
            self.updateConcatCells(cell);
          }
        },
        error : function () {
          console.error('Cell model saved unsuccessfully!', arguments);
          cell.value = oldValue;
          self.updateConcatCells(cell);
        }
      });
    }

  },

  //We just trigger a changed event for concat cells when we are a identifier cell
  updateConcatCells : function (changedCell) {
    if (changedCell.isIdentifier) {
      Dispatcher.trigger(changedCell.changedCellEvent, changedCell);
    }
  },

  removeRowHandler : function (payload) {
    var tableId = payload.tableId;
    var rowId = payload.rowId;
    var table = this.get(tableId);
    var row = table.rows.get(rowId);
    row.destroy();
  },

  addRowHandler : function (payload) {
    var self = this;
    var tableId = payload.tableId;
    var table = this.get(tableId);
    var rows = table.rows;

    var newRow = new Row({tableId : tableId, columns : table.columns}, {collection : rows});

    newRow.save({}, {
      success : function (row) {
        rows.add(row);
      },
      error : function (err) {
        self.cleanUpRow(newRow);
        rows.remove(newRow);
        console.error('could not add new row!', err, arguments);
      }
    });

  },

  url : function () {
    return apiUrl('/tables');
  },

  parse : function (response) {
    return response.tables;
  }

});

module.exports = Tables;
