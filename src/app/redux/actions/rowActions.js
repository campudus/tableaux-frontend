import f from "lodash/fp";
import {
  createRowDuplicatesRequest,
  getSaveableRowDuplicate
} from "../../components/cells/cellCopyHelper";
import { getAnnotationConfig } from "../../helpers/annotationHelper";
import { makeRequest } from "../../helpers/apiHelper";
import route from "../../helpers/apiRoutes.js";
import { doto } from "../../helpers/functools";
import P from "../../helpers/promise";
import ActionTypes from "../actionTypes";
import { toggleAnnotationFlag } from "./annotationActions";

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

// TODO: Let the backend handle this once /safelyDuplicate is implemented
// When duplicating rows, we must make sure that link constraints are not
// broken, else the backend will reject.
export const safelyDuplicateRow = ({
  tableId,
  rowId,
  langtag,
  cell,
  onSuccess,
  onError
}) => async (dispatch, getState) => {
  const state = getState();
  const columns = f.prop(["columns", tableId, "data"], state);
  const row = doto(
    state,
    f.prop(["rows", tableId, "data"]),
    f.find(f.propEq("id", rowId))
  );

  const saveableRowDuplicate = getSaveableRowDuplicate({ columns, row });

  try {
    const duplicatedRow = await createRowDuplicatesRequest(
      tableId,
      saveableRowDuplicate
    ).then(f.prop("rows"));
    dispatch({
      type: ADDITIONAL_ROWS_DATA_LOADED,
      tableId,
      rows: duplicatedRow
    });

    dispatch({
      type: TOGGLE_CELL_SELECTION,
      tableId,
      rowId: duplicatedRow[0].id,
      columnId: cell.column.id,
      langtag
    });

    const hasCheckMeAnnotationConfig = !!getAnnotationConfig("check-me");
    // Set a flag when we deleted values during copy
    const checkMeAnnotation = { type: "flag", value: "check-me" };
    saveableRowDuplicate.constrainedLinkIds.forEach(columnId =>
      dispatch(
        toggleAnnotationFlag({
          cell: {
            table: { id: tableId },
            row: { id: duplicatedRow[0].id },
            column: { id: columnId }
          },
          ...(hasCheckMeAnnotationConfig && { annotation: checkMeAnnotation })
        })
      )
    );

    onSuccess && onSuccess();
  } catch (err) {
    onError && onError(err);
    console.error("While duplicating row:", err);
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
