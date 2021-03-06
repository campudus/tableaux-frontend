import f from "lodash/fp";
import actionTypes from "../actionTypes";

const {
  COLUMNS_LOADING_DATA,
  COLUMNS_DATA_LOADED,
  COLUMNS_DATA_LOAD_ERROR,
  CLEAN_UP,
  COLUMN_EDIT_SUCCESS
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
            return { ...column, visible: true };
          }, action.result.columns)
        }
      };
    case COLUMNS_DATA_LOAD_ERROR:
      return {
        [action.tableId]: { error: action.error, finishedLoading: true }
      };
    case CLEAN_UP:
      return {
        ...state,
        [action.tableId]: []
      };
    case COLUMN_EDIT_SUCCESS:
      return f.update(
        [action.tableId, "data"],
        columns =>
          f.flow(
            f.findIndex(column => action.columnId === column.id),
            index => f.set([index], action.result, columns)
          )(columns),
        state
      );
    default:
      return state;
  }
};

export default columns;
