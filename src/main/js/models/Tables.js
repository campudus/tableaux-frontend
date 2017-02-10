import Collection from "ampersand-rest-collection";
import apiUrl from "../helpers/apiUrl";
import Table from "./Table";
import Dispatcher from "../dispatcher/Dispatcher";
import {ActionTypes} from "../constants/TableauxConstants";
import ActionCreator from "../actions/ActionCreator";
import Row from "./Row";
import {cellModelSavingError, noPermissionAlertWithLanguage} from "../components/overlay/ConfirmationOverlay.jsx";
import {
  getUserLanguageAccess,
  getUserCountryCodesAccess,
  canUserChangeCell,
  reduceValuesToAllowedLanguages,
  reduceValuesToAllowedCountries,
  isUserAdmin
} from "../helpers/accessManagementHelper";
import request from "superagent";

// sets or removes a *single* link to/from a link cell
const changeLinkCellHandler = ({cell, value}) => {
  const newValue = value;
  const curValue = cell.value;
  const toggledRowId = _.first(_.xor(curValue.map(link => link.id), newValue.map(link => link.id)));
  if (!toggledRowId) {
    return;
  }
  const {rowId,tableId} = cell;
  const colId = cell.column.id;
  const backendUrl = apiUrl(`/tables/${tableId}/columns/${colId}/rows/${rowId}`);
  cell.set({value: newValue}); // set locally so fast follow-up request will have correct state
  const xhrRequest = (curValue.length > newValue.length)
    ? request.delete(`${backendUrl}/link/${toggledRowId}`)
    : request
      .patch(backendUrl)
      .send({value: toggledRowId})
      .set("Content-Type", "application/json");
  xhrRequest.end((error, response) => {
    if (error) {
      console.warn(error);
      cell.set({value: curValue}); // rollback local state when anything went wrong
      cellModelSavingError(error); // this saves us from calculating and undoing diff ourselves
      this.updateConcatCells(cell);
    }
  });
};

const Tables = Collection.extend({
  model: Table,

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
    if(payload.cell.isLink) {
      changeLinkCellHandler(payload);
      return;
    }
    const self = this;
    const {cell} = payload;
    const oldValue = cell.value;
    let newValue = payload.value; //value we send to the server
    let mergedValue; //The value we display for the user
    let updateNecessary = false;
    let isPatch = false;

    //Setup for saving the cell
    if (cell.isMultiLanguage) {
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
      /**
       * Basic language access management
       */
      if (!isUserAdmin()) {
        if (!canUserChangeCell(cell)) {
          noPermissionAlertWithLanguage(getUserLanguageAccess());
          return;
        } else {
          if (cell.isMultiCountry) {
            newValue = reduceValuesToAllowedCountries(newValue);
            if (_.isEmpty(newValue.value)) {
              //The user tried to change a multilanguage cell without language permission
              noPermissionAlertWithLanguage(getUserLanguageAccess(), getUserCountryCodesAccess());
              return;
            }
          } else {
            //reduce values to send just authorized language values to server
            newValue = reduceValuesToAllowedLanguages(newValue);
            if (_.isEmpty(newValue.value)) {
              //The user tried to change a multilanguage cell without language permission
              noPermissionAlertWithLanguage(getUserLanguageAccess(), getUserCountryCodesAccess());
              return;
            }
          }
        }
      }
      /**
       * End basic language access management
       */

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
        patch: isPatch,
        wait: true,
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

    /**
     * Basic language access management
     */
    if (!isUserAdmin()) {
      return;
    }

    row.destroy();
  },

  addRowHandler(payload) {
    const self = this;
    const tableId = payload.tableId;
    const table = this.get(tableId);
    const rows = table.rows;

    /**
     * Basic language access management
     */
    if (!isUserAdmin()) {
      noPermissionAlertWithLanguage(getUserLanguageAccess());
      return;
    }

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
