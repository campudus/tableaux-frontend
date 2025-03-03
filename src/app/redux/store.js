import { createStore, applyMiddleware, compose } from "redux";

import { maybe } from "../helpers/functools";
import rootReducer from "./reducers/rootReducer";
import thunkMiddleware from "./thunkMiddleware";

// If redux devtools are installed and we're not running in production mode
// and we didn't request devtools to be disabled, then use redux devtools
const composeEnhancers = maybe(window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__)
  .map(devCompose =>
    import.meta.env.NODE_ENV === "production" ||
    import.meta.env.REDUX_DEVTOOLS === "false"
      ? null
      : devCompose
  )
  .getOrElse(compose);

const store = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(thunkMiddleware()))
);
export default store;
