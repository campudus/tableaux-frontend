import * as ActionCreator from "./actions/ActionCreator";
import React from "react";
import ReactDOM from "react-dom";
import Tableaux from "./components/Tableaux.jsx";
import f from "lodash/fp";
import TableauxConstants, {ActionTypes, FilterModes} from "./constants/TableauxConstants";
import Raven from "raven-js";
import {AppContainer} from "react-hot-loader";
import Router from "ampersand-router";
import App from "ampersand-app";
import Dispatcher from "./dispatcher/Dispatcher";
import Tables from "./models/Tables";

export let currentLangtag = null;

const parseOptions = optString => {
  if (!optString || f.isEmpty(optString)) {
    return {};
  }
  const opts = ((optString[0] === "?") ? optString.substring(1) : optString).split("&");
  const parseFilter = function (str) {
    const els = str.split(":");
    if (f.size(els) > 1) {
      if (els[1] === "id") {
        return {
          filter: {
            mode: FilterModes.ID_ONLY,
            value: f.map(f.toNumber, f.drop(2, els))
          }
        };
      }
    } else {
      return {filter: true};
    }
  }; // will get more complex once we implement filter routes
  const parseEntityView = function (str) {
    return {entityView: {focusElement: str.split(":").length > 1}};
  };
  const getOptions = f.cond([
    [f.startsWith("filter"), parseFilter],
    [f.startsWith("details"), parseEntityView]
  ]);
  return f.reduce(f.merge, {}, f.map(getOptions, opts));
};

let cachedTables = null;

const getTables = () => new Promise(
  (resolve, reject) => {
    if (f.isNil(cachedTables)) {
      const tables = new Tables();
      tables.fetch({
        success: () => {
          cachedTables = tables;
          resolve(cachedTables);
        },
        error: (err) => {
          reject(err);
        }
      });
    } else {
      resolve(cachedTables);
    }
  }
);

const validateLangtag = (langtag) => {
  return (f.isNil(langtag) || !f.contains(langtag, TableauxConstants.Langtags))
    ? TableauxConstants.DefaultLangtag
    : langtag;
};

async function getFirstTableId() {
  const tables = await getTables();
  return f.get("id", tables.first());
}

async function validateTableId(tableId) {
  const tables = await getTables();
  const firstTableId = f.always(await getFirstTableId());
  return f.cond([
    [f.isNil, firstTableId],
    [(id) => f.isNil(tables.get(id)), firstTableId],
    [f.stubTrue, f.identity]
  ])(tableId);
}

const TableauxRouter = Router.extend({
  routes: {
    "": "noTableAndLangtag",
    ":langtag(/)": "noTableAndLangtag",
    "tables(/)": "noTableAndLangtag",
    ":langtag/tables(/)": "noTable",

    ":langtag/tables/:tableid(/columns/:columnid)(/rows/:rowid)(?:options)": "tableBrowser",

    ":langtag/media(/)": "mediaBrowser",
    ":langtag/media/:folderid": "mediaBrowser",
    "(:langtag/)table(/)": "redirectToNewUrl",
    "(:langtag/)table/*rest": "redirectToNewUrl"
  },

  alreadyRendered: false,

  redirectToNewUrl: function (langtag = null, rest = null) {
    const prefix = (langtag) ? `${langtag}/` : "";
    const suffix = (rest) || "";
    return this.redirectTo(`${prefix}tables/${suffix}`);
  },

  renderOrSwitchView: function (viewName, params) {
    if (this.alreadyRendered) {
      ActionCreator.switchView(viewName, params);
    } else {
      this.alreadyRendered = true;

      ReactDOM.render(
        <AppContainer><Tableaux initialViewName={viewName} initialParams={params} /></AppContainer>,
        document.getElementById("tableaux")
      );

      // Hot Module Replacement API
      if (module.hot) {
        module.hot.accept("./components/Tableaux.jsx", () => {
          const TableauxNext = require("./components/Tableaux.jsx").default;

          ReactDOM.render(
            <AppContainer><TableauxNext initialViewName={viewName} initialParams={params} /></AppContainer>,
            document.getElementById("tableaux")
          );
        });
      }
    }
  },

  initialize: function (options) {
    console.log("init router");
    Dispatcher.on(ActionTypes.SWITCH_TABLE, this.switchTableHandler);
    Dispatcher.on(ActionTypes.SWITCH_FOLDER, this.switchFolderHandler);
    Dispatcher.on(ActionTypes.SWITCH_LANGUAGE, this.switchLanguageHandler, this);
  },

  switchLanguageHandler: function (newLangtagObj) {
    const his = this.history;
    const path = his.getPath();
    const newPath = path.replace(currentLangtag, newLangtagObj.langtag);

    his.navigate(newPath, {trigger: true});
  },

  switchTableHandler: async function (payload) {
    const langtag = payload.langtag;
    const tableId = await validateTableId(payload.id);
    Raven.captureBreadcrumb({message: "Switch table", data: payload});
    Raven.captureMessage("Switch table", {level: "info"});
    App.router.navigate(langtag + "/tables/" + tableId);
  },

  switchFolderHandler: function (payload) {
    Raven.captureBreadcrumb({message: "Switch folder", data: payload});
    Raven.captureMessage("MediaView folder switch", {level: "info"});
    const langtag = payload.langtag;
    if (payload.id) {
      App.router.history.navigate(langtag + "/media/" + payload.id, {trigger: true});
    } else {
      App.router.history.navigate(langtag + "/media", {trigger: true});
    }
  },

  noTableAndLangtag: function () {
    console.log("TableauxRouter.noTableAndLangtag");
    const langtag = TableauxConstants.DefaultLangtag;
    this.redirectTo(langtag + "/tables");
  },

  noTable: async function (langtag) {
    console.log("TableauxRouter.noTable");
    const tables = await getTables();
    const tableId = await getFirstTableId();

    this.renderOrSwitchView(TableauxConstants.ViewNames.TABLE_VIEW, {
      tables,
      table: tables.get(tableId),
      langtag: validateLangtag(langtag)
    });
  },

  tableBrowser: async function (urlLangtag, tableid, a, b, c) {
    const optionalArgs = [a, b, c].filter(x => x);
    const langtag = validateLangtag(urlLangtag);

    // sort optional args to values
    let columnid, rowid, optionStr;
    if (optionalArgs.length === 3) {
      [columnid, rowid, optionStr] = optionalArgs;
    } else if (optionalArgs.length === 2) {
      if (f.startsWith("filter", f.last(optionalArgs))) {
        [rowid, optionStr] = optionalArgs;
      } else {
        [columnid, rowid] = optionalArgs;
      }
    } else {
      if (f.startsWith("filter", f.first(optionalArgs))) {
        [optionStr] = optionalArgs;
      } else {
        [rowid] = optionalArgs;
      }
    }

    const urlOptions = parseOptions(optionStr);
    console.log("urlOptions:", urlOptions);

    console.log(`TableauxRouter.tableBrowser lang=${langtag}, table=${tableid} column=${columnid} row=${rowid} filtering=${(urlOptions.filter)
      ? "yes"
      : "no"}`);
    currentLangtag = langtag;
    // TODO show error to user
    if (typeof tableid === "undefined" || isNaN(parseInt(tableid))) {
      console.error("path param 'tableid' is not valid");
      this.noTableAndLangtag();
      return;
    } else if (typeof langtag === "undefined" || TableauxConstants.Langtags.indexOf(langtag) === -1) {
      console.error("path param 'langtag' is not valid");
      this.noTableAndLangtag();
      return;
    }

    const tables = await getTables();
    const validTableId = await validateTableId(parseInt(tableid));

    this.renderOrSwitchView(TableauxConstants.ViewNames.TABLE_VIEW, {
      table: tables.get(validTableId),
      tables: tables,
      langtag: langtag,
      columnId: (columnid) ? parseInt(columnid) : null,
      rowId: (rowid) ? parseInt(rowid) : null,
      urlOptions
    });
  },

  mediaBrowser: function (langtag, folderid) {
    console.log("TableauxRouter.mediaBrowser", langtag, folderid);
    currentLangtag = validateLangtag(langtag);

    this.renderOrSwitchView(TableauxConstants.ViewNames.MEDIA_VIEW, {
      folderId: parseInt(folderid) || null,
      langtag: validateLangtag(langtag)
    });
  }
});

module.exports = TableauxRouter;
