import actionTypes from "../actionTypes";
import f from "lodash/fp";
import { doto } from "../../helpers/functools";

const {
  ALL_ROWS_LOADING_DATA,
  ALL_ROWS_DATA_LOADED,
  ALL_ROWS_DATA_LOAD_ERROR,
  CELL_SET_VALUE,
  CELL_ROLLBACK_VALUE
} = actionTypes;

const initialState = {};

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
      const { columnIdx, rowIdx } = idsToIndices(action, {
        state,
        completeState
      });
      const rowSelector = [action.tableId, "data", rowIdx, "values"];
      return f.update(rowSelector, f.assoc(columnIdx, action.newValue), state);
    }
    case CELL_ROLLBACK_VALUE: {
      const { columnIdx, rowIdx } = idsToIndices(action, {
        state,
        completeState
      });
      const rowSelector = [action.tableId, "data", rowIdx, "values"];
      return f.update(rowSelector, f.assoc(columnIdx, action.oldValue), state);
    }
    default:
      return state;
  }
};

const idsToIndices = (
  { columnId, tableId, rowId },
  { state, completeState } = {}
) => {
  const columnIdx = doto(
    completeState,
    f.prop(["columns", tableId, "data"]),
    f.findIndex(f.propEq("id", columnId))
  );
  const rowIdx = doto(
    state,
    f.prop([tableId, "data"]),
    f.findIndex(f.propEq("id", rowId))
  );
  return { columnIdx, rowIdx };
};

export default rows;
