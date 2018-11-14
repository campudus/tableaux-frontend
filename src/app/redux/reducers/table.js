import actionTypes from "../actionTypes";

const {LOAD_TABLES} = actionTypes;
const initialState = {
  tables: {}
};

const tables = (state = initialState, action) => {
  console.log(action);
  switch (action.type) {
    case LOAD_TABLES:
      return {...state, tables: action.result};
    default:
      return state;
  }
};

export default tables;
