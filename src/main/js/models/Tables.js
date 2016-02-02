var Collection = require('ampersand-rest-collection');
var apiUrl = require('../helpers/apiUrl');
var Table = require('./Table');
var Dispatcher = require('../dispatcher/Dispatcher');
var ActionTypes = require('../constants/TableauxConstants').ActionTypes;
var Row = require('./Row');
var Cells = require('./Cells');
var Cell = require('./Cell');

var Tables = Collection.extend({
  model : Table,

  initialize : function () {
    console.log("Rows.initialize:", arguments);
    Dispatcher.on(ActionTypes.CHANGE_CELL, this.changeCellHandler, this);
    Dispatcher.on(ActionTypes.REMOVE_ROW, this.removeRowHandler, this);
    Dispatcher.on(ActionTypes.ADD_ROW, this.addRowHandler, this);
  },

  changeCellHandler : function (payload) {
    console.log("changeCellHandler:", payload);
    console.log("Rows this", this);

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
      cell.value = mergedValue;
      console.log("Cell Model: saving cell with value:", newValue);
      cell.save(newValue, {
        patch : isPatch,
        success : function () {
          console.log('Cell model saved successfully.');
          //FIXME: Discuss with Backend: Status Code + latest value object from database
        },
        error : function () {
          console.error('Cell model saved unsuccessfully!', arguments);
          cell.value = oldValue;
        }
      });
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

    var newRow = new Row({tableId : tableId});
    newRow.save({}, {
      success : function (savedRow) {
        //FIXME: Team Backend should return the empty row completly instead of just "Ok"
        table.rows.getOrFetch(savedRow.id, function (error) {
          if (error) {
            console.error("Error getOrFetch Rows: ", error);
          }
        });
      },
      error : function (err) {
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
