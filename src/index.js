import "babel-polyfill";
import "../node_modules/react-select/dist/react-select.css";
import "../node_modules/codemirror/lib/codemirror.css";
import "react-virtualized/styles.css";
import "./app/helpers/connectionWatcher";
import { initConfig } from "./app/constants/TableauxConstants";
import fetch from "cross-fetch";

import { Provider } from "react-redux";
import React from "react";
import ReactDOM from "react-dom";

import GRUDRouter from "./app/components/Router.jsx";
import store from "./app/redux/store";

console.log("Campudus GRUD frontend", process.env.BUILD_ID);

fetch("/config.json")
  .then(response => response.json())
  .then(initConfig)
  .then(() => {
    ReactDOM.render(
      <Provider store={store}>
        <GRUDRouter />
      </Provider>,
      document.querySelector("#tableaux")
    );
  });
