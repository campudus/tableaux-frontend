import { createStore, applyMiddleware, compose } from "redux";

import { maybe } from "../helpers/functools";
import rootReducer from "./reducers/rootReducer";
import thunkMiddleware from "./thunkMiddleware";

const composeEnhancers = maybe(
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
).getOrElse(compose);

const store = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(thunkMiddleware()))
);
export default store;
