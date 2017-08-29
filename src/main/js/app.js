import Raven from "raven-js";
import {getAllLangtagsFromServer, getSentryUrlFromServer} from "./helpers/serverSettingsHelper";
import App from "ampersand-app";
import Router from "./router";
import TableauxConstants from "./constants/TableauxConstants";
import {initDevelopmentAccessCookies} from "./helpers/accessManagementHelper";
import "../index.html";
import "../scss/main.scss";
import "./dispatcher/GlobalCellChangeListener";
import "dom4";

import Cookies from "js-cookie";

const isProduction = process.env.NODE_ENV === "production";

window.devLog = (isProduction)
  ? function () {}
  : function () {
    console.log.apply(this, ["devel:", ...arguments]);
  };

window.devWarn = (isProduction)
  ? function () {}
  : function () {
    console.warn.apply(this, ["devel:", ...arguments]);
  };

window.devErr = (isProduction)
  ? function () {}
  : function () {
    console.error.apply(this, ["devel:", ...arguments]);
  };

window.logIf = (isProduction)
  ? function () {}
  : function (test, ...params) {
    if (test) {
      console.log(...params);
    }
  };

console.log("GRUD version", process.env.BUILD_VERSION);
if (isProduction) {
  require("./watchers/watchConnection");
  getSentryUrlFromServer(
    () => {
      console.warn("Sentry not enabled");
    },
    (sentryUrl) => {
      if (sentryUrl && sentryUrl.length > 5) {
        const userName = Cookies.get("userName") || "Unknown user";
        Raven
          .config(sentryUrl, {
            release: process.env.BUILD_VERSION
          })
          .setUserContext({id: userName})
          .install();

        Raven.captureMessage("Sentry initialized", {
          level: "info"
        });
      } else {
        console.warn("Could not get Sentry url, Sentry not enabled");
      }
    });
} else {
  window.Perf = require("react-addons-perf");
  require("../../tests/runTests");
}

App.extend({

  init: function () {
    // gets called just in development
    initDevelopmentAccessCookies();

    // Global tableaux variable. Used for some DOM References
    window.GLOBAL_TABLEAUX = {};

    // init all available langtags from server before continuing
    getAllLangtagsFromServer((err) => {
      console.warn("error:", err);
    }, (languages) => {
      TableauxConstants.initLangtags(languages);
      this.router = new Router();
      this.router.history.start();
    });
  }

});

App.init();
