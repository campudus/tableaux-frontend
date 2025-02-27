// babel polyfill: https://babeljs.io/docs/en/babel-polyfill
import "core-js/stable";
import "regenerator-runtime/runtime";

import "react-virtualized/styles.css";
import "./scss/main.scss";
import fetch from "cross-fetch";

import { Provider } from "react-redux";
import React from "react";
import ReactDOM from "react-dom";

import TableauxConstants from "./app/constants/TableauxConstants";

console.log("Campudus GRUD frontend", process.env.BUILD_ID);

fetch("/config.json")
  .then(response => response.json())
  .then(TableauxConstants.initConfig)
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
