import Collection from "ampersand-rest-collection";
import apiUrl from "../helpers/apiUrl";
import Table from "./Table";
import Dispatcher from "../dispatcher/Dispatcher";
import {ActionTypes} from "../constants/TableauxConstants";
import ActionCreator from "../actions/ActionCreator";
import Row from "./Row";
import {cellModelSavingError, noPermissionAlertWithLanguage} from "../components/overlay/ConfirmationOverlay.jsx";
import {
  canUserChangeCell,
  getUserCountryCodesAccess,
  getUserLanguageAccess,
  isUserAdmin,
  reduceValuesToAllowedCountries,
  reduceValuesToAllowedLanguages
} from "../helpers/accessManagementHelper";
import request from "superagent";
import * as _ from "lodash";
import * as f from "lodash/fp";
import Raven from "raven-js";

// sets or removes a *single* link to/from a link cell
const changeLinkCell = ({cell, value}) => {
  const curValue = cell.value;

  if (process.env.NODE_ENV !== "production") {
    console.log("Cell Model: changing cell", cell.id, "value from:", cell.value, "to", value);
  }

  if (f.size(value) > 1
    && f.size(curValue) === f.size(value)
    && f.size(f.intersection(value.map(f.get("id")), curValue.map(f.get("id")))) === f.size(curValue)
  ) { // reordering happened
    const swappers = f.compose(
      f.map(f.get([0, "id"])),
      f.reject(([a, b]) => f.get("id", a) === f.get("id", b))
    )(f.zip(value, cell.value));
    cell.set({value: f.map(f.pick(["id", "value"]), value)}); // don't store LinkOverlay's display value
    const sortUrl = `/tables/${cell.tableId}/columns/${cell.column.id}/rows/${cell.row.id}/link/${f.first(swappers)}/order`;
    return new Promise(
      (resolve, reject) => {
        if (f.isEmpty(swappers)) {
          reject("Something went horribly wrong. Swappers:", swappers);
        }
        request
          .put(apiUrl(sortUrl))
          .send({
            location: "before",
            id: swappers[1]
          })
          .end(
            (err, response) => {
              if (err) {
                cell.set({value: curValue});
                reject(err);
              } else {
                ActionCreator.broadcastDataChange({cell: cell, row: cell.row});
                resolve(response);
              }
            }
          );
      }
    );
  }

  const rowDiff = _.xor(curValue.map(link => link.id), value.map(link => link.id));
  if (_.size(rowDiff) > 1) { // multiple new values, set new array
    return new Promise(
      (resolve, reject) => {
        cell.save({value}, {
          success: () => {
            ActionCreator.broadcastDataChange({cell: cell, row: cell.row});
            resolve(cell.value);
          },
          error: err => reject("Could not set multiple link values:", err)
        });
      }
    );
  }

  // Else a single link was added or removed
  const [toggledRowId] = rowDiff;
  if (!toggledRowId) {
    return new Promise((resolve, reject) => {
      reject("Tried to toggle zero links");
    });
  }
  const {rowId, tableId} = cell;
  const colId = cell.column.id;
  const backendUrl = apiUrl(`/tables/${tableId}/columns/${colId}/rows/${rowId}`);
  cell.set({value: value}); // set locally so fast follow-up request will have correct state
  const xhrRequest = (curValue.length > value.length)
    ? request.delete(`${backendUrl}/link/${toggledRowId}`)
    : request
      .patch(backendUrl)
      .send({value: toggledRowId})
      .set("Content-Type", "application/json");
  return new Promise(
    (resolve, reject) => {
      xhrRequest.end((error, response) => {
        if (error) {
          console.warn(error);
          cell.set({value: curValue}); // rollback local state when anything went wrong
          cellModelSavingError(error); // this saves us from calculating and undoing diff ourselves
          reject(error);
        } else {
          ActionCreator.broadcastDataChange({cell: cell, row: cell.row});
          resolve(value);
        }
      });
    });
};

export const changeCell = payload => {
  Raven.captureBreadcrumb({message: "Cell modified", data: {cell: payload.cell.id}});
  Raven.captureMessage("Cell edited", {level: "info"});
  if (payload.cell.isLink) {
    return changeLinkCell(payload);
  }
  const {cell} = payload;
  const oldValue = cell.value;
  let newValue = payload.value; // value we send to the server
  let mergedValue; // The value we display for the user
  let updateNecessary = false;
  let isPatch = false;

  // Setup for saving the cell
  if (cell.isMultiLanguage) {
    mergedValue = _.assign({}, oldValue, newValue);
    newValue = {value: newValue};
    updateNecessary = !_.isEqual(oldValue, mergedValue);
    isPatch = true;
  } else {
    updateNecessary = !_.isEqual(oldValue, newValue);
    mergedValue = newValue;
    newValue = {value: newValue};
  }

  return new Promise(
    (resolve, reject) => {
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
                // The user tried to change a multilanguage cell without language permission
                noPermissionAlertWithLanguage(getUserLanguageAccess(), getUserCountryCodesAccess());
                return;
              }
            } else {
              // reduce values to send just authorized language values to server
              newValue = reduceValuesToAllowedLanguages(newValue);
              if (_.isEmpty(newValue.value)) {
                // The user tried to change a multilanguage cell without language permission
                noPermissionAlertWithLanguage(getUserLanguageAccess(), getUserCountryCodesAccess());
                return;
              }
            }
          }
        }
        /**
         * End basic language access management
         */

        if (process.env.NODE_ENV !== "production") {
          console.log("Cell Model: changing cell", cell.id, "value from:", cell.value, "to", newValue.value);
        }
        // we give direct feedback for user
        cell.value = mergedValue;

        // we need to clear the newValue, otherwise ampersand save method is merging a strange object
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
            ActionCreator.broadcastDataChange({cell: cell, row: cell.row});
            // is there new data from the server?
            if (!_.isEqual(data.value, mergedValue) && (process.env.NODE_ENV !== "production")) {
              console.log("Cell model saved successfully. Server data changed meanwhile:", data.value, mergedValue);
              cell.value = data.value;
            }
            resolve();
          },
          error(error) {
            cellModelSavingError(error);
            cell.value = oldValue;
            reject(error);
          }
        });
      } else {
        console.log("No update required");
        resolve(newValue);
      }
    });
};

const Tables = Collection.extend({
  model: Table,

  initialize() {
    Dispatcher.on(ActionTypes.CHANGE_CELL, this.changeCellHandler, this);
    Dispatcher.on(ActionTypes.REMOVE_ROW, this.removeRowHandler, this);
    Dispatcher.on(ActionTypes.CREATE_ROW, this.addRowHandler, this);
    Dispatcher.on(ActionTypes.CLEANUP_TABLE, this.cleanupTable, this);
  },

  // Clear current/old collections to prevent reinitializing bugs and free memory
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
    const cb = payload.cb || function () {};
    changeCell(payload).then(cb());
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
    const {tableId, cb} = payload;
    const table = this.get(tableId);
    const rows = table.rows;

    /**
     * Basic language access management
     */
    if (!isUserAdmin()) {
      noPermissionAlertWithLanguage(getUserLanguageAccess());
      return;
    }

    const newRow = new Row({
      tableId: tableId,
      columns: table.columns
    }, {collection: rows});
    ActionCreator.spinnerOn();

    newRow.save({}, {
      success(row) {
        rows.add(row);
        if (cb) {
          cb(row);
        }
        ActionCreator.spinnerOff();
      },
      error(err) {
        self.cleanUpRow(newRow);
        rows.remove(newRow);
        console.error("could not add new row!", err, arguments);
        ActionCreator.spinnerOff();
      }
    });
  },

  url() {
    return apiUrl("/tables");
  },

  parse(response) {
    return response.tables;
  }

});

export default Tables;
