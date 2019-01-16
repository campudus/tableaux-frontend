import f from "lodash/fp";
import actionTypes from "../actionTypes";

const {
  COLUMNS_LOADING_DATA,
  COLUMNS_DATA_LOADED,
  COLUMNS_DATA_LOAD_ERROR
} = actionTypes;

const initialState = {};

const columns = (state = initialState, action) => {
  const { tableId, type } = action;
  switch (type) {
    case COLUMNS_LOADING_DATA:
      return {
        ...state,
        [action.tableId]: { error: false, finishedLoading: false }
      };
    case COLUMNS_DATA_LOADED:
      return {
        ...state,
        [tableId]: {
          error: false,
          finishedLoading: true,
          data: f.map(column => {
            return {...column, visible: true};
          }, action.result.columns)
        }
      };
    case COLUMNS_DATA_LOAD_ERROR:
      return {
        ...state,
        [action.tableId]: { error: action.error, finishedLoading: true }
      };
    default:
      return state;
  }
};

export default columns;
