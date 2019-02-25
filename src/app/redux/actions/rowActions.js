import f from "lodash/fp";

import { ColumnKinds } from "../../constants/TableauxConstants";
import { doto } from "../../helpers/functools";
import { makeRequest } from "../../helpers/apiHelper";
import { toggleAnnotationFlag } from "./annotationActions";
import ActionTypes from "../actionTypes";
import route from "../../helpers/apiRoutes.js";

const {
  ADDITIONAL_ROWS_DATA_LOADED,
  ALL_ROWS_DATA_LOADED,
  ADD_ROWS
} = ActionTypes;
const { SHOW_TOAST } = ActionTypes.overlays;

// TODO: Let the backend handle this once /safelyDuplicate is implemented
// When duplicating rows, we must make sure that link constraints are not
// broken, else the backend will reject.
export const safelyDuplicateRow = ({
  tableId,
  rowId,
  DuplicatedMessage
}) => async (dispatch, getState) => {
  const state = getState();
  const columns = f.prop(["columns", tableId, "data"], state);
  const row = doto(
    state,
    f.prop(["rows", tableId, "data"]),
    f.find(f.propEq("id", rowId))
  );

  const constrainedLinkIds = columns.filter(
    column =>
      column.kind === ColumnKinds.link &&
      !f.isEmpty(f.prop("constraint.cardinality"), column)
  );
  const isConstrainedLink = column => f.contains(column.id, constrainedLinkIds);

  // We can't check cardinality from the frontend, so we won't copy links with cardinality
  const duplicatedValues = row.values.map((value, idx) =>
    isConstrainedLink(columns[idx]) ? null : value
  );

  try {
    const duplicatedRow = await makeRequest({
      apiRoute: route.toTable({ tableId }) + "/rows",
      data: { columns, rows: [{ values: duplicatedValues }] },
      method: "POST"
    });

    dispatch({ type: ADDITIONAL_ROWS_DATA_LOADED, rows: [duplicatedRow] }); // additionalrow?

    // Set a flag when we deleted values during copy
    const checkMeAnnotation = { type: "flag", value: "check-me" };
    constrainedLinkIds.forEach(columnId =>
      dispatch(
        toggleAnnotationFlag({
          cell: {
            table: { id: tableId },
            row: { id: rowId },
            column: { id: columnId }
          },
          annotation: checkMeAnnotation
        })
      )
    );
  } catch (err) {
    dispatch({ type: SHOW_TOAST, content: DuplicatedMessage });
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
    const { getAllRowsForTable } = route;
    const {
      page: { totalSize },
      rows
    } = await makeRequest({
      apiRoute: getAllRowsForTable(tableId),
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
        apiRoute: getAllRowsForTable(tableId),
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
