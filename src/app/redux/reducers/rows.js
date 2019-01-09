import actionTypes from "../actionTypes";
import f from "lodash/fp";
import { idsToIndices, calcConcatValues } from "../redux-helpers";

const {
  ALL_ROWS_LOADING_DATA,
  ALL_ROWS_DATA_LOADED,
  ALL_ROWS_DATA_LOAD_ERROR,
  CELL_SET_VALUE,
  CELL_ROLLBACK_VALUE,
  CELL_SAVED_SUCCESSFULLY
} = actionTypes;

const initialState = {};

const maybeUpdateConcats = (rows, action, completeState) => {
  const concatValues = calcConcatValues(action, completeState);
  const { rowIdx, updatedConcatValue } = concatValues;
  const { tableId } = action;

  return concatValues
    ? f.assoc([tableId, "data", rowIdx, 0], updatedConcatValue, rows)
    : rows;
};

const rows = (state = initialState, action, completeState) => {
  switch (action.type) {
    case ALL_ROWS_LOADING_DATA:
      return {
        ...state,
        [action.tableId]: { error: false, finishedLoading: false }
      };
    case ALL_ROWS_DATA_LOADED:
      return {
        ...state,
        [action.tableId]: {
          error: false,
          finishedLoading: true,
          data: action.result.rows
        }
      };
    case ALL_ROWS_DATA_LOAD_ERROR:
      return {
        ...state,
        [action.tableId]: { error: action.error, finishedLoading: true }
      };
    case CELL_SET_VALUE: {
      const [rowIdx, columnIdx] = idsToIndices(action, completeState);
      const rowSelector = [action.tableId, "data", rowIdx, "values"];
      return f.update(rowSelector, f.assoc(columnIdx, action.newValue), state);
    }
    case CELL_ROLLBACK_VALUE: {
      const [rowIdx, columnIdx] = idsToIndices(action, completeState);
      const rowSelector = [action.tableId, "data", rowIdx, "values"];
      return f.update(rowSelector, f.assoc(columnIdx, action.oldValue), state);
    }
    case CELL_SAVED_SUCCESSFULLY:
      return maybeUpdateConcats(state, action, completeState);
    default:
      return state;
  }
};

export default rows;
