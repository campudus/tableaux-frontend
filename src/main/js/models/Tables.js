import Collection from "ampersand-rest-collection";
import apiUrl from "../helpers/apiUrl";
import Table from "./Table";
import Dispatcher from "../dispatcher/Dispatcher";
import {ActionTypes, ColumnKinds} from "../constants/TableauxConstants";
import ActionCreator from "../actions/ActionCreator";
import Row from "./Row";
import {noPermissionAlertWithLanguage} from "../components/overlay/ConfirmationOverlay.jsx";
import {
  getUserLanguageAccess,
  isUserAdmin
} from "../helpers/accessManagementHelper";
import * as f from "lodash/fp";
import i18n from "i18next";
import React from "react";
import changeCell from "./helpers/changeCell";

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
    const cb = payload.cb || function () {
    };
    changeCell(payload).then(cb);
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

    const isEmptyOrConcat = cell => (f.isEmpty(cell.value) && !f.isNumber(cell.value) && cell.value !== true)
      || f.matchesProperty(["column", "kind"], ColumnKinds.concat)(cell)
      || f.matchesProperty(["column", "kind"], ColumnKinds.group)(cell);

    const lastRowIsEmpty = f.flow(
      f.last,
      f.get(["cells", "models"]),
      f.every(isEmptyOrConcat)
    )(table.rows.models);
    if (lastRowIsEmpty && table.rows.models.length > 0) {
      ActionCreator.showToast(<div id="cell-jump-toast">{i18n.t("table:cant-add-row")}</div>, 2000);
      return;
    }

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

export {changeCell};
export default Tables;
