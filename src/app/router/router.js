import "babel-polyfill";

import { Provider } from "react-redux";
import { bindActionCreators } from "redux";
import React from "react";
import ReactDOM from "react-dom";
import Router from "ampersand-router";
import * as Sentry from "@sentry/browser";
import f from "lodash/fp";
import i18n from "i18next";

import { ENABLE_DASHBOARD } from "../FeatureFlags";
import { initDevelopmentAccessCookies } from "../helpers/accessManagementHelper";
import { posOrNil, validateLangtag, validateTableId } from "./routeValidators";
import { requestAvailableServices } from "../frontendServiceRegistry/frontendServices";
import { when } from "../helpers/functools";
import Tableaux from "../components/Tableaux";
import TableauxConstants from "../constants/TableauxConstants";
import actionCreators from "../redux/actionCreators";
import parseOptions from "./urlOptionParser";
import store from "../redux/store.js";

initDevelopmentAccessCookies();

export let currentLangtag = null;
const router = new Router();

const extendedRouter = Router.extend({
  routes: {
    "(:langtag/)dashboard(/)": "dashboard",
    "(:langtag/)tables(/:tableid)(/columns/:columnid)(/rows/:rowid)(/)(?:options)":
      "tableBrowser",

    "(:langtag/)media(/)": "mediaBrowser",
    "(:langtag/)media/:folderid": "mediaBrowser",
    "(:langtag/)table(/)": "redirectToNewUrl",
    "(:langtag/)table/*rest": "redirectToNewUrl",
    "(:langtag/)services/:id(/)": "frontendService",
    "(:langtag/)services/:id(/tables/:tableId)(/columns/:columnId)(/rows/:rowId)":
      "frontendService",
    "*anything": "home"
  },

  home: function() {
    ENABLE_DASHBOARD ? this.dashboard() : this.tableBrowser();
  },

  redirectToNewUrl: async function(langtag = null, rest = null) {
    const { tables } = store.getState();
    const validTableId = await validateTableId(null, tables);
    const prefix = langtag ? `${langtag}/` : "";
    const suffix = rest || validTableId;
    return this.redirectTo(`${prefix}tables/${suffix}`);
  },
  actions: bindActionCreators(actionCreators, store.dispatch),

  renderOrSwitchView: function(viewName, params) {
    const { setCurrentLanguage } = this.actions;
    setCurrentLanguage(params.langtag);
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

  initialize: function() {
    const { loadTables, createDisplayValueWorker } = this.actions;
    loadTables();
    createDisplayValueWorker();
  },

  switchLanguageHandler: function(newLangtag) {
    const his = this.history;
    const path = his.getPath();
    const newPath = path.replace(currentLangtag, newLangtag);
    i18n.changeLanguage(newLangtag);
    currentLangtag = newLangtag;
    his.navigate(newPath, { trigger: true });
  },

  switchTableHandler: async function(tableId, langtag) {
    const { tables } = store.getState();
    const validTableId = await validateTableId(tableId, tables);
    Sentry.addBreadcrumb({ message: "Switch table", data: tableId });
    Sentry.captureMessage("Switch table", { level: "info" });
    router.navigate(langtag + "/tables/" + validTableId);
  },

  switchFolderHandler: async function(folderId, langtag) {
    Sentry.addBreadcrumb({
      message: "Switch folder",
      data: { folderId, langtag }
    });
    Sentry.captureMessage("MediaView folder switch", { level: "info" });
    const validLangtag = await validateLangtag(langtag);
    if (folderId) {
      router.history.navigate(validLangtag + "/media/" + folderId, {
        trigger: true
      });
    } else {
      router.history.navigate(validLangtag + "/media", { trigger: true });
    }
  },

  selectCellHandler: function(tableId, rowId, columnId, langtag) {
    const validRowId = posOrNil(rowId);
    const validColumnId = posOrNil(columnId);
    if (!f.isNil(validRowId) && !f.isNil(validColumnId)) {
      router.navigate(
        langtag +
          "/tables/" +
          tableId +
          "/columns/" +
          validColumnId +
          "/rows/" +
          validRowId,
        { trigger: false, replace: true }
      );
    }
  },

  tableBrowser: async function(langtag, tableId, columnId, rowId, options) {
    const {
      tableView: { currentTable },
      tables
    } = store.getState();
    const validTableId = await validateTableId(parseInt(tableId), tables);
    const validRowId = posOrNil(rowId);
    const validColumnId = posOrNil(columnId);

    const validLangtag = await validateLangtag(langtag);
    currentLangtag = validLangtag;
    const urlOptions = parseOptions(options);

    if (currentTable !== validTableId || !currentTable) {
      const { loadCompleteTable, toggleCellSelection, cleanUp } = this.actions;
      cleanUp(validTableId);
      console.log({validTableId});
      loadCompleteTable(validTableId, f.get("filter", urlOptions));

      // when table changes set initial selected cell to values from url
      toggleCellSelection({
        rowId: validRowId,
        columnId: validColumnId,
        langtag: validLangtag
      });
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
      urlOptions: urlOptions
    };

    this.renderOrSwitchView(
      TableauxConstants.ViewNames.TABLE_VIEW,
      tableParams
    );
    this.history.navigate(fullUrl, { trigger: true, replace: true });
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
  },

  frontendService: async function(
    langtag,
    serviceId,
    tableId,
    columnId,
    rowId
  ) {
    if (f.isEmpty(serviceId)) {
      return this.home(langtag());
    }

    const { tables } = store.getState();
    const validLangtag = await validateLangtag(langtag);
    const validTableId = await validateTableId(parseInt(tableId, 10), tables);
    currentLangtag = validLangtag;

    const id = parseInt(serviceId);
    this.renderOrSwitchView(TableauxConstants.ViewNames.FRONTEND_SERVICE_VIEW, {
      langtag: validLangtag,
      tableId: f.isString(tableId) ? validTableId : null,
      columnId: when(f.isString, f.parseInt(10), columnId),
      rowId: when(f.isString, f.parseInt(10), rowId),
      id
    });
    this.history.navigate("/" + validLangtag + "/services/" + serviceId, {
      trigger: false,
      replace: true
    });
  }
});

const GRUDRouter = new extendedRouter();
GRUDRouter.history.start();
requestAvailableServices();

export default GRUDRouter;
