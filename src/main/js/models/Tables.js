import Collection from 'ampersand-rest-collection';
import apiUrl from '../helpers/apiUrl';
import Table from './Table';
import Dispatcher from '../dispatcher/Dispatcher';
import { ActionTypes } from '../constants/TableauxConstants';
import ActionCreator from '../actions/ActionCreator';
import Row from './Row';
import { cellModelSavingError } from '../components/overlay/ConfirmationOverlay.jsx';

var Tables = Collection.extend({
  model : Table,

  initialize() {
    console.log("Rows.initialize:", arguments);
    Dispatcher.on(ActionTypes.CHANGE_CELL, this.changeCellHandler, this);
    Dispatcher.on(ActionTypes.REMOVE_ROW, this.removeRowHandler, this);
    Dispatcher.on(ActionTypes.CREATE_ROW, this.addRowHandler, this);
    Dispatcher.on(ActionTypes.CLEANUP_TABLE, this.cleanupTable, this);
  },

  //Clear current/old collections to prevent reinitializing bugs and free memory
  cleanupTable(payload) {
    const tableId = payload.tableId;
    const tableToCleanUp = this.get(tableId);
    const rowsToCleanup = tableToCleanUp.rows;
    const columnsToCleanup = tableToCleanUp.columns;
    this.cleanUpRows(rowsToCleanup);
    columnsToCleanup.reset();
    ActionCreator.cleanupTableDone();
  },

  cleanUpRows(rowsToCleanup) {
    rowsToCleanup.forEach(row => this.cleanUpRow(row));
    rowsToCleanup.reset();
  },

  cleanUpRow(rowToCleanup) {
    const cellsToCleanUp = rowToCleanup.cells;
    cellsToCleanUp.forEach(cell => cell.cleanupCell());
  },

  changeCellHandler(payload) {
    console.log("changeCellHandler:", payload);
    const self = this;

    const tableId = payload.tableId;
    const cellId = payload.cellId;
    const rowId = payload.rowId;

    const table = this.get(tableId);
    const row = table.rows.get(rowId);
    const cell = row.cells.get(cellId);
    const oldValue = cell.value;
    let newValue = payload.value; //value we send to the server
    let mergedValue; //The value we display for the user
    let updateNecessary = false;
    let isPatch = false;

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
        success(model, data, options) {
          //is there new data from the server?
          if (!_.isEqual(data.value, mergedValue)) {
            console.log('Cell model saved successfully. Server data changed meanwhile:', data.value, mergedValue);
            cell.value = data.value;
            self.updateConcatCells(cell);
          }
        },
        error(error) {
          cellModelSavingError(error);
          cell.value = oldValue;
          self.updateConcatCells(cell);
        }
      });
    }

  },

  //We just trigger a changed event for concat cells when we are a identifier cell
  updateConcatCells(changedCell) {
    if (changedCell.isIdentifier) {
      Dispatcher.trigger(changedCell.changedCellEvent, changedCell);
    }
  },

  removeRowHandler(payload) {
    const tableId = payload.tableId;
    const rowId = payload.rowId;
    const table = this.get(tableId);
    const row = table.rows.get(rowId);
    row.destroy();
  },

  addRowHandler(payload) {
    const self = this;
    const tableId = payload.tableId;
    const table = this.get(tableId);
    const rows = table.rows;

    const newRow = new Row({tableId : tableId, columns : table.columns}, {collection : rows});
    ActionCreator.spinnerOn();

    newRow.save({}, {
      success(row) {
        rows.add(row);
        ActionCreator.spinnerOff();
      },
      error(err) {
        self.cleanUpRow(newRow);
        rows.remove(newRow);
        console.error('could not add new row!', err, arguments);
        ActionCreator.spinnerOff();
      }
    });

  },

  url() {
    return apiUrl('/tables');
  },

  parse(response) {
    return response.tables;
  }

});

module.exports = Tables;
