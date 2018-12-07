import f from "lodash/fp";
import actionTypes from "../actionTypes";
import {toObjectById} from "../../helpers/funcHelpers";

const {
  COLUMNS_LOADING_DATA,
  COLUMNS_DATA_LOADED,
  COLUMNS_DATA_LOAD_ERROR,
  TOGGLE_COLUMN_VISIBILITY,
  HIDE_ALL_COLUMNS,
  SHOW_ALL_COLUMNS
} = actionTypes;

const initialState = {};

const columns = (state = initialState, action) => {
  const {tableId, columnId, type} = action;
  switch (type) {
    case COLUMNS_LOADING_DATA:
      return {
        ...state,
        [action.tableId]: {error: false, finishedLoading: false}
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
        [action.tableId]: {error: action.error, finishedLoading: true}
      };
    case TOGGLE_COLUMN_VISIBILITY:
      return toggleSingleColumn(state, tableId, columnId);
    case HIDE_ALL_COLUMNS:
      return setAllColumns(state, tableId, false);
    case SHOW_ALL_COLUMNS:
      return setAllColumns(state, tableId, true);
    default:
      return state;
  }
};

const toggleSingleColumn = (state, tableId, columnId) => {
  const path = [tableId, "data"];
  const previousData = f.get(path, state);
  return f.set(
    path,
    f.map(column => {
      if (column.id === columnId) {
        return {...column, visible: !column.visible};
      }
      return column;
    }, previousData),
    state
  );
};

const setAllColumns = (state, tableId, value) => {
  const path = [tableId, "data"];
  const previousData = f.get(path, state);
  const temp = f.set(
    path,
    f.map(column => {
      return {...column, visible: value};
    }, previousData),
    state
  );
  return temp;
};

export default columns;
