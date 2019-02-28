import f from "lodash/fp";

import { doto } from "../../helpers/functools";
import { getSaveableRowDuplicate } from "../../components/cells/cellCopyHelper";
import { makeRequest } from "../../helpers/apiHelper";
import { toggleAnnotationFlag } from "./annotationActions";
import ActionTypes from "../actionTypes";
import route from "../../helpers/apiRoutes.js";

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
  successCallback,
  errorCallback
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
    const duplicatedRow = await makeRequest({
      apiRoute: route.toTable({ tableId }) + "/rows",
      data: f.pick(["columns", "rows"], saveableRowDuplicate),
      method: "POST"
    }).then(f.prop("rows"));
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
          annotation: checkMeAnnotation
        })
      )
    );

    successCallback && successCallback();
  } catch (err) {
    errorCallback && errorCallback(err);
    console.error("While duplicating row:", err);
  }
};

export const loadAllRows = tableId => dispatch => {
  const buildParams = (allRows, rowsPerRequest) => {
    if (allRows <= rowsPerRequest) {
      return [{ offset: 30, limit: allRows }];
    }
    return f.compose(
      f.map(offset => {
        return { offset, limit: rowsPerRequest };
      }),
      f.rangeStep(rowsPerRequest, 30)
    )(allRows % rowsPerRequest !== 0 ? allRows + 1 : allRows);
  };

  const fetchRowsPaginated = async (tableId, parallelRequests) => {
    const { toRows } = route;
    const {
      page: { totalSize },
      rows
    } = await makeRequest({
      apiRoute: toRows(tableId),
      params: {
        offset: 0,
        limit: 30
      },
      method: "GET"
    });
    dispatch(addRows(tableId, rows));
    const params = buildParams(totalSize, 500);
    var resultLength = rows.length;
    var index = 0;
    const recReq = () => {
      if (index >= params.length) {
        return;
      }
      const oldIndex = index;
      index++;
      return makeRequest({
        apiRoute: toRows(tableId),
        params: params[oldIndex],
        method: "GET"
      }).then(result => {
        resultLength = resultLength + result.rows.length;
        dispatch(addRows(tableId, result.rows));
        if (resultLength >= totalSize) {
          dispatch({ type: ALL_ROWS_DATA_LOADED, tableId });
          return;
        }
        recReq();
      });
    };
    f.forEach(
      recReq,
      new Array(
        parallelRequests > params.length ? params.length : parallelRequests
      )
    );
  };
  fetchRowsPaginated(tableId, 4);
};

const addRows = (tableId, rows) => {
  return {
    type: ADD_ROWS,
    tableId,
    rows
  };
};
