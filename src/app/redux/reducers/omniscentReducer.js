import f from "lodash/fp";

// it is like combinedReducer, but also passes the complete state object as third
// parameter to slice reducers
export const omniscentReducer = reducerMap => {
  const stateNames = f.keys(reducerMap);
  let currentState = {};
  return (state = {}, action) => {
    let updated = false;

    const nextState = stateNames.reduce((accum, name) => {
      accum[name] = reducerMap[name](state[name], action, state);
      if (!f.equals(accum[name], currentState[name])) {
        updated = true;
      }
      return accum;
    }, {});

    currentState = updated ? nextState : currentState;
    return currentState;
  };
};
