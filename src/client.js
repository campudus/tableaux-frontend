import ReactDOM from "react-dom";
import React from "react";
import {Provider} from "react-redux";
import store from "./app/redux/store.js";
import App from "./app/components/App.js";


ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);
