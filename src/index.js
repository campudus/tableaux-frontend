import "babel-polyfill";
import "../node_modules/react-select/dist/react-select.css";
import "./app/helpers/connectionWatcher";

import { Provider } from "react-redux";
import React from "react";
import ReactDOM from "react-dom";

import GRUDRouter from "./app/components/Router.jsx";
import store from "./app/redux/store";

console.log("Campudus GRUD frontend", process.env.BUILD_ID);

ReactDOM.render(
  <Provider store={store}>
    <GRUDRouter />
  </Provider>,
  document.querySelector("#tableaux")
);
