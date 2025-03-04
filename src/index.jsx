// vite doesn't define a global field in window as webpack does.
// some libraries rely on it since webpack is much older than vite.
window.global ||= window;

// babel polyfill: https://babeljs.io/docs/en/babel-polyfill
import "core-js/stable";
import "regenerator-runtime/runtime";

import "react-virtualized/styles.css";
import "./scss/main.scss";
import fetch from "cross-fetch";

import { Provider } from "react-redux";
import React from "react";
import ReactDOM from "react-dom";

import { initConfig } from "./app/constants/TableauxConstants";

console.log("Build id:", import.meta.env.BUILD_ID);

fetch("/config.json")
  .then(response => response.json())
  .then(initConfig)
  .then(async () => {
    // postpone loading of this imports after config is loaded
    // this is needed, else the disabled authentication will not work as it memoize the config value without the config being loaded
    await import("./app/helpers/connectionWatcher");
    const GRUDRouter = (await import("./app/components/Router.jsx")).default;
    const store = (await import("./app/redux/store")).default;

    ReactDOM.render(
      <Provider store={store}>
        <GRUDRouter />
      </Provider>,
      document.querySelector("#tableaux")
    );
  });
