import f from "lodash/fp";
import { createRowDuplicatesRequest } from "../../components/cells/cellCopyHelper";
import { makeRequest } from "../../helpers/apiHelper";
import route from "../../helpers/apiRoutes.js";
import P from "../../helpers/promise";
import ActionTypes from "../actionTypes";

const {
  ADDITIONAL_ROWS_DATA_LOADED,
  ALL_ROWS_DATA_LOADED,
  ADD_ROWS,
  ROW_CREATE,
  ROW_CREATE_ERROR,
  ROW_CREATE_SUCCESS
} = ActionTypes;
const { TOGGLE_CELL_SELECTION } = ActionTypes.tableView;

// Post an empty row to the backend to receive a valid rowId
// TODO: make toggle_cell_selection always scroll to cell, like router dispatch does
export const addEmptyRow = tableId => ({
  promise: makeRequest({
    apiRoute: route.toRows(tableId),
    method: "POST"
  }),
  actionTypes: [ROW_CREATE, ROW_CREATE_SUCCESS, ROW_CREATE_ERROR],
  tableId
});

export const safelyDuplicateRow = ({
  tableId,
  rowId,
  langtag,
  cell,
  onSuccess,
  onError
}) => async dispatch => {
  try {
    const duplicatedRow = await createRowDuplicatesRequest(tableId, rowId);
    dispatch({
      type: ADDITIONAL_ROWS_DATA_LOADED,
      tableId,
      rows: [duplicatedRow]
    });

    if (cell?.column) {
      dispatch({
        type: TOGGLE_CELL_SELECTION,
        tableId,
        rowId: duplicatedRow.id,
        columnId: cell.column.id,
        langtag
      });
    }

    if (onSuccess) onSuccess();
    return duplicatedRow;
  } catch (err) {
    if (onError) onError(err);
    console.error("While duplicating row:", err);
    return Promise.reject(
      new Error(
        `Could not duplicate row ${rowId} of table ${tableId}: ${err.message ??
          err}`
      )
    );
  }
};

export const loadAllRows = (tableId, archived = false) => async dispatch => {
  const PARALLELL_CHUNKS = 4;
  const ROWS_PER_CHUNK = 500;
  const INITIAL_ROWS = 30;

  const preloadParam = {
    offset: 0,
    limit: INITIAL_ROWS,
    archived
  };

  const buildParams = (allRows, rowsPerRequest) => {
    if (allRows <= rowsPerRequest) {
      return [{ ...preloadParam, offset: INITIAL_ROWS, limit: allRows }];
    }
    return f.compose(
      f.map(offset => {
        return { ...preloadParam, offset, limit: rowsPerRequest };
      }),
      f.rangeStep(rowsPerRequest, INITIAL_ROWS)
    )(allRows % rowsPerRequest !== 0 ? allRows + 1 : allRows);
  };

  const loadPaginatedRows = async params => {
    const paginatedRows = await makeRequest({
      apiRoute: route.toRows(tableId),
      params,
      method: "get"
    });
    dispatch(addRows(tableId, paginatedRows.rows));
    return paginatedRows;
  };

  const {
    page: { totalSize }
  } = await loadPaginatedRows(preloadParam);
  if (totalSize > INITIAL_ROWS) {
    const pageConfigs = buildParams(totalSize, ROWS_PER_CHUNK);
    await P.chunk(PARALLELL_CHUNKS, loadPaginatedRows, pageConfigs);
  }
  dispatch({ type: ALL_ROWS_DATA_LOADED, tableId });
};

const addRows = (tableId, rows) => {
  return {
    type: ADD_ROWS,
    tableId,
    rows
  };
};
