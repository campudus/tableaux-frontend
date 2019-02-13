import { createStore, applyMiddleware, compose } from "redux";

import { maybe } from "../helpers/functools";
import rootReducer from "./reducers/rootReducer";
import thunkMiddleware from "./thunkMiddleware";

const store = createStore(
  rootReducer,
  compose(
    applyMiddleware(thunkMiddleware()),
    ware => {
      maybe(window).method("__REDUX_DEVTOOLS_EXTENSION__");
      return ware;
    }
  )
);
export default store;
