import {createStore, applyMiddleware, compose} from "redux";
import rootReducer from "./reducers/rootReducer";
import thunkMiddleware from "./thunkMiddleware";
const store = createStore(
  rootReducer,
  compose(
    applyMiddleware(thunkMiddleware())
    // window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  )
);
export default store;
