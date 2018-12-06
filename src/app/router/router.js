import React from "react";
import ReactDOM from "react-dom";
import TableContainer from "../containers/TableContainer";
import TableauxConstants, {ActionTypes} from "../constants/TableauxConstants";
import Raven from "raven-js";
import {AppContainer} from "react-hot-loader";
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
import {ENABLE_DASHBOARD} from "../FeatureFlags";
import {Provider} from "react-redux";
import store from "../redux/store.js";

export let currentLangtag = null;
const router = new Router();

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
    console.log("home called");
    // (ENABLE_DASHBOARD) ? this.dashboard() : this.tableBrowser();
    this.tableBrowser();
  },

  redirectToNewUrl: function(langtag = null, rest = null) {
    console.log("redirectToNewUrl");
    const prefix = langtag ? `${langtag}/` : "";
    const suffix = rest || "";
    return this.redirectTo(`${prefix}tables/${suffix}`);
  },

  renderOrSwitchView: function(viewName, params) {
    console.log("renderOrSwitchView");
    if (/*this.alreadyRendered*/ false) {
      // ActionCreator.switchView(viewName, params);
    } else {
      this.alreadyRendered = true;
      console.log(viewName, params);

      ReactDOM.render(
        <Provider store={store}>
          <TableContainer initialViewName={viewName} initialParams={params}/>
        </Provider>,
        document.getElementById("tableaux")
      );

      // Hot Module Replacement API
      // if (module.hot) {
      //   module.hot.accept("../components/Tableaux.jsx", () => {
      //     const TableauxNext = require("../components/Tableaux.jsx").default;

      //     ReactDOM.render(
      //       <AppContainer><TableauxNext initialViewName={viewName} initialParams={params} /></AppContainer>,
      //       document.getElementById("tableaux")
      //     );
      //   });
      // }
    }
  },

  initialize: function(options) {
    // console.log("init router");
    // Dispatcher.on(ActionTypes.SWITCH_TABLE, this.switchTableHandler);
    // Dispatcher.on(ActionTypes.SWITCH_FOLDER, this.switchFolderHandler);
    // Dispatcher.on(ActionTypes.SWITCH_LANGUAGE, this.switchLanguageHandler, this);
  },

  switchLanguageHandler: function(newLangtagObj) {
    const his = this.history;
    const path = his.getPath();
    const newPath = path.replace(currentLangtag, newLangtagObj.langtag);

    his.navigate(newPath, {trigger: true});
  },

  switchTableHandler: async function(payload) {
    const langtag = payload.langtag;
    const tableId = await validateTableId(payload.id);
    Raven.captureBreadcrumb({message: "Switch table", data: payload});
    Raven.captureMessage("Switch table", {level: "info"});
    router.navigate(langtag + "/tables/" + tableId);
  },

  switchFolderHandler: function(payload) {
    Raven.captureBreadcrumb({message: "Switch folder", data: payload});
    Raven.captureMessage("MediaView folder switch", {level: "info"});
    const langtag = validateLangtag(payload.langtag);
    if (payload.id) {
      router.history.navigate(langtag + "/media/" + payload.id, {
        trigger: true
      });
    } else {
      router.history.navigate(langtag + "/media", {trigger: true});
    }
  },

  tableBrowser: async function(langtag, tableId, columnId, rowId, options) {
    console.log("TableauxRouter.tableBrowser", arguments);

    const validTableId = await validateTableId(parseInt(tableId));
    const validColumnId = posOrNil(columnId);
    const validRowId = posOrNil(rowId);
    // const tables = await getTables();
    const validLangtag = validateLangtag(langtag);

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

    console.log("tableParams", tableParams);

    this.renderOrSwitchView(
      TableauxConstants.ViewNames.TABLE_VIEW,
      tableParams
    );
    this.history.navigate(fullUrl, {trigger: false, replace: true});
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
    this.history.navigate(fullUrl, {trigger: false, replace: true});
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
