import React from "react";
import ReactDOM from "react-dom";
import TableContainer from "../containers/TableContainer";
import TableauxConstants, { ActionTypes } from "../constants/TableauxConstants";
import Raven from "raven-js";
import { AppContainer } from "react-hot-loader";
import Router from "ampersand-router";
import App from "ampersand-app";
import f from "lodash/fp";
import parseOptions from "./urlOptionParser";
import {
  getTables,
  posOrNil,
  validateLangtag,
  validateTableId
} from "./routeValidators";
import { ENABLE_DASHBOARD } from "../FeatureFlags";
import { Provider } from "react-redux";
import { bindActionCreators } from "redux";
import store from "../redux/store.js";
import actionCreators from "../redux/actionCreators";
import Tableaux from "../components/Tableaux";
import { initDevelopmentAccessCookies } from "../helpers/accessManagementHelper";

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

  alreadyRendered: false,

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
    const { loadTables, loadAllRows, loadColumns } = this.actions;
    const { tableId } = params;
    // loadAllRows(tableId);
    // loadColumns(tableId);
    if (/*this.alreadyRendered*/ false) {
      this.switchTableHandler(params);
    } else {
      this.alreadyRendered = true;

      //<TableContainer initialViewName={viewName} initialParams={{...params, navigate: this.navigate.bind(this)}}/>
      ReactDOM.render(
        <Provider store={store}>
          <Tableaux
            initialViewName={viewName}
            initialParams={{ ...params, navigate: this.navigate.bind(this) }}
          />
        </Provider>,
        document.getElementById("tableaux")
      );
    }
  },

  initialize: function(options) {
    const { loadTables, createDisplayValueWorker } = this.actions;
    loadTables();
    createDisplayValueWorker();
    console.log("initialize router");
    // const worker = new Worker("/worker.js");
    // worker.postMessage(["receive", "this","shit"]);
  },

  switchLanguageHandler: function(newLangtagObj) {
    const his = this.history;
    const path = his.getPath();
    const newPath = path.replace(currentLangtag, newLangtagObj.langtag);

    his.navigate(newPath, { trigger: true });
  },

  switchTableHandler: function(payload) {
    console.log("switchTableHandler");
    const { tables } = store.getState();
    const langtag = payload.langtag;
    const tableId = validateTableId(payload.id, tables);
    Raven.captureBreadcrumb({ message: "Switch table", data: payload });
    Raven.captureMessage("Switch table", { level: "info" });
    router.navigate(langtag + "/tables/" + tableId);
  },

  switchFolderHandler: function(payload) {
    Raven.captureBreadcrumb({ message: "Switch folder", data: payload });
    Raven.captureMessage("MediaView folder switch", { level: "info" });
    const langtag = validateLangtag(payload.langtag);
    if (payload.id) {
      router.history.navigate(langtag + "/media/" + payload.id, {
        trigger: true
      });
    } else {
      router.history.navigate(langtag + "/media", { trigger: true });
    }
  },

  tableBrowser: async function(langtag, tableId, columnId, rowId, options) {
    const validTableId = await validateTableId(parseInt(tableId));
    const validColumnId = posOrNil(columnId);
    const validRowId = posOrNil(rowId);
    const validLangtag = validateLangtag(langtag);

    const {
      tableView: { currentTable },
      tables
    } = store.getState();

    if (currentTable != validTableId || !currentTable) {
      const { loadCompleteTable } = this.actions;
      loadCompleteTable(tableId);
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

  mediaBrowser: function(langtag, folderid) {
    // console.log("TableauxRouter.mediaBrowser", langtag, folderid);
    const validLangtag = validateLangtag(langtag);
    currentLangtag = validLangtag;
    const validFolderId = posOrNil(folderid);

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

  dashboard: function(langtag) {
    // console.log("TableauxRouter.dashboard");
    const validLangtag = validateLangtag(langtag);
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
