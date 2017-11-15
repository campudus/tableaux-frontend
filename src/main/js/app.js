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

const conditionalLogger = (logger) => (test, ...args) => {
  if (test) {
    logger(...args);
  }
};

window.devLog = (isProduction)
  ? function () {}
  : function (...args) {
    console.log("devel:", ...args);
  };

window.devWarn = (isProduction)
  ? function () {}
  : function (...args) {
    console.warn("devel:", ...args);
  };

window.devErr = (isProduction)
  ? function () {}
  : function (...args) {
    console.error("devel", ...args);
  };

window.devLogIf = conditionalLogger(window.devLog);
window.devWarnIf = conditionalLogger(window.devWarn);
window.devErrorIf = conditionalLogger(window.devErr);

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
