import "babel-polyfill";
import React from "react";
import ReactDOM from "react-dom";
import TableauxConstants from "../constants/TableauxConstants";
import Raven from "raven-js";
import Router from "ampersand-router";
import f from "lodash/fp";
import parseOptions from "./urlOptionParser";
import { posOrNil, validateLangtag, validateTableId } from "./routeValidators";
import { ENABLE_DASHBOARD } from "../FeatureFlags";
import { Provider } from "react-redux";
import { bindActionCreators } from "redux";
import store from "../redux/store.js";
import actionCreators from "../redux/actionCreators";
import Tableaux from "../components/Tableaux";
import { initDevelopmentAccessCookies } from "../helpers/accessManagementHelper";
import i18n from "i18next";

initDevelopmentAccessCookies();

export let currentLangtag = null;
const router = new Router();

// const loadCompleteTable = (tableId, actions) =>
//   f.compose(
//     f.each(func => func(tableId)),
//     f.values,
//     f.pick(["setCurrentTable", "loadColumns", "loadAllRows"])
//   )(actions);

const extendedRouter = Router.extend({
  routes: {
    "(:langtag)(/)": "home",
    "(:langtag/)dashboard(/)": "dashboard",
    "(:langtag/)tables(/:tableid)(/columns/:columnid)(/rows/:rowid)(/)(?:options)":
      "tableBrowser",

    ":langtag/media(/)": "mediaBrowser",
    ":langtag/media/:folderid": "mediaBrowser",
    "(:langtag/)table(/)": "redirectToNewUrl",
    "(:langtag/)table/*rest": "redirectToNewUrl"
  },

  home: function() {
    ENABLE_DASHBOARD ? this.dashboard() : this.tableBrowser();
  },

  redirectToNewUrl: function(langtag = null, rest = null) {
    const prefix = langtag ? `${langtag}/` : "";
    const suffix = rest || "";
    return this.redirectTo(`${prefix}tables/${suffix}`);
  },
  actions: bindActionCreators(actionCreators, store.dispatch),

  renderOrSwitchView: function(viewName, params) {
    ReactDOM.render(
      <Provider store={store}>
        <Tableaux
          initialViewName={viewName}
          initialParams={{ ...params, navigate: this.navigate.bind(this) }}
        />
      </Provider>,
      document.getElementById("tableaux")
    );
  },

  initialize: function(options) {
    const { loadTables, createDisplayValueWorker } = this.actions;
    loadTables();
    createDisplayValueWorker();
    console.log("initialize router", options);
  },

  switchLanguageHandler: function(newLangtag) {
    const his = this.history;
    const path = his.getPath();
    const newPath = path.replace(currentLangtag, newLangtag);
    const { setCurrentLanguage } = this.actions;
    setCurrentLanguage(newLangtag);
    i18n.changeLanguage(newLangtag);
    currentLangtag = newLangtag;
    his.navigate(newPath, { trigger: true });
  },

  switchTableHandler: async function(tableId, langtag) {
    const { tables } = store.getState();
    const validTableId = await validateTableId(tableId, tables);
    Raven.captureBreadcrumb({ message: "Switch table", data: tableId });
    Raven.captureMessage("Switch table", { level: "info" });
    router.navigate(langtag + "/tables/" + validTableId);
  },

  switchFolderHandler: async function(folderId, langtag) {
    Raven.captureBreadcrumb({
      message: "Switch folder",
      data: { folderId, langtag }
    });
    Raven.captureMessage("MediaView folder switch", { level: "info" });
    const validLangtag = await validateLangtag(langtag);
    if (folderId) {
      router.history.navigate(validLangtag + "/media/" + folderId, {
        trigger: true
      });
    } else {
      router.history.navigate(validLangtag + "/media", { trigger: true });
    }
  },

  selectCellHandler: function(tableId, rowId, columnId) {
    const validRowId = posOrNil(rowId);
    const validColumnId = posOrNil(columnId);

    if (validRowId && validColumnId) {
      router.navigate(
        currentLangtag +
          "/tables/" +
          tableId +
          "/columns/" +
          validColumnId +
          "/rows/" +
          validRowId,
        { trigger: false }
      );
    }
  },

  tableBrowser: async function(langtag, tableId, columnId, rowId, options) {
    const { createDisplayValueWorker, loadAllRows, loadColumns } = this.actions;
    const {
      tableView: { currentTable },
      tables
    } = store.getState();
    const validTableId = await validateTableId(parseInt(tableId), tables);
    const validColumnId = posOrNil(columnId);
    const validRowId = posOrNil(rowId);
    const validLangtag = await validateLangtag(langtag);
    currentLangtag = validLangtag;
    loadColumns(validTableId);
    loadAllRows(validTableId);
    createDisplayValueWorker();

    if (currentTable !== validTableId || !currentTable) {
      const { loadCompleteTable } = this.actions;
      loadCompleteTable(validTableId);
    }

    const fullUrl =
      "/" +
      validLangtag +
      "/tables/" +
      validTableId +
      (f.isNil(validColumnId) ? "" : `/columns/${validColumnId}`) +
      (f.isNil(validRowId) ? "" : `/rows/${validRowId}`);

    const tableParams = {
      tableId: validTableId,
      langtag: validLangtag,
      columnId: validColumnId,
      rowId: validRowId,
      urlOptions: parseOptions(options)
    };

    this.renderOrSwitchView(
      TableauxConstants.ViewNames.TABLE_VIEW,
      tableParams
    );
    this.history.navigate(fullUrl, { trigger: false, replace: true });
  },

  mediaBrowser: async function(langtag, folderid) {
    const { getMediaFolder } = this.actions;
    const validFolderId = posOrNil(folderid);
    const validLangtag = await validateLangtag(langtag);
    currentLangtag = validLangtag;

    getMediaFolder(validFolderId, validLangtag);

    const fullUrl =
      "/" +
      validLangtag +
      "/media" +
      (f.isNil(validFolderId) ? "" : `/${validFolderId}`);

    this.renderOrSwitchView(TableauxConstants.ViewNames.MEDIA_VIEW, {
      folderId: validFolderId,
      langtag: validLangtag
    });
    this.history.navigate(fullUrl, { trigger: false, replace: true });
  },

  dashboard: async function(langtag) {
    const validLangtag = await validateLangtag(langtag);
    currentLangtag = validLangtag;
    this.renderOrSwitchView(TableauxConstants.ViewNames.DASHBOARD_VIEW, {
      langtag: validLangtag
    });
    this.history.navigate("/" + validLangtag + "/dashboard", {
      trigger: false,
      replace: true
    });
  }
});

const TableauxRouter = new extendedRouter();
TableauxRouter.history.start();

export default TableauxRouter;
