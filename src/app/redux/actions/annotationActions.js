import f from "lodash/fp";

import { makeRequest } from "../../helpers/apiHelper";
import { when } from "../../helpers/functools";
import ActionTypes from "../actionTypes.js";
import route from "../../helpers/apiRoutes";

const Change = { ADD: "ADD", DELETE: "DELETE" };
const {
  SET_CELL_ANNOTATION,
  SET_ROW_ANNOTATION,
  SET_ROWS_ANNOTATION,
  REMOVE_CELL_ANNOTATION,
  SET_ANNOTATION_ERROR
} = ActionTypes;

const modifyAnnotationLangtags = change => action => (dispatch, getState) => {
  const { cell, annotation, onError, onSuccess } = action;
  const { rowIdx, colIdx, annotations } = findAnnotations(getState, action);

  const valueKey = when(
    f.eq("needsTranslation"),
    () => "translation_needed",
    annotation.value
  );

  const existingAnnotation = annotations.find(
    ann => ann.type === "flag" && ann.value === valueKey
  );

  const oldLangtags = f.propOr([], "langtags", existingAnnotation);
  const newLangtags = annotation.langtags;

  const langtags =
    change === Change.ADD
      ? f.union(oldLangtags, newLangtags)
      : f.difference(oldLangtags, newLangtags);

  const shouldDelete = f.isEmpty(langtags) || action.setTo === false;
  const couldFindUuid =
    annotation.uuid || (existingAnnotation && existingAnnotation.uuid);

  const promise = shouldDelete
    ? makeRequest(paramToDeleteAnnotation(cell, annotation))
    : change === Change.ADD
    ? makeRequest(paramToSetAnnotation(cell, annotation))
    : // else remove individual tags
      Promise.all(
        newLangtags.map(lt =>
          makeRequest(
            paramToDeleteAnnotationLangtag(cell, existingAnnotation, lt)
          )
        )
      );
  // Avoid langtag race condition
  if (!(shouldDelete && !couldFindUuid)) {
    dispatch({
      promise,
      actionTypes: [
        shouldDelete ? REMOVE_CELL_ANNOTATION : SET_CELL_ANNOTATION,
        shouldDelete ? "NOTHING_TO_DO" : SET_CELL_ANNOTATION,
        SET_ANNOTATION_ERROR
      ],
      annotation: f.assoc(
        "langtags",
        langtags,
        existingAnnotation || annotation
      ),
      annotations,
      cell,
      rowIdx,
      colIdx,
      onError,
      onSuccess
    });
  }
};

const setTextAnnotation = change => action => (dispatch, getState) => {
  const { cell, annotation, onError, onSuccess } = action;
  const { rowIdx, colIdx, annotations } = findAnnotations(getState, action);
  const existingAnnotation = annotations.find(
    ann => ann.type === annotation.type && ann.uuid === annotation.uuid
  );

  const shouldDelete = change === Change.DELETE || action.setTo === false;
  console.log(
    "setTextAnnotation()",
    action,
    "shouldDelete?",
    shouldDelete,
    "existingAnnotation:",
    existingAnnotation
  );

  dispatch({
    promise: makeRequest(
      shouldDelete
        ? paramToDeleteAnnotation(cell, existingAnnotation)
        : paramToSetAnnotation(cell, annotation)
    ),
    actionTypes: [
      shouldDelete ? REMOVE_CELL_ANNOTATION : SET_CELL_ANNOTATION,
      shouldDelete ? "DO_NOTHING" : SET_CELL_ANNOTATION,
      SET_ANNOTATION_ERROR
    ],
    annotation: existingAnnotation || annotation,
    annotations,
    cell,
    rowIdx,
    colIdx,
    onError,
    onSuccess
  });
};

const getRequestParam = change => (cell, annotationObj) => {
  const { table, row, column } = cell;
  console.log("Param for", change, "incoming annotation", annotationObj);
  const annotation = when(
    f.has("annotation"),
    f.prop("annotation"),
    annotationObj
  );
  const apiRoute =
    route.toCell({
      tableId: table.id,
      rowId: row.id,
      columnId: column.id
    }) +
    (change === Change.ADD
      ? "/annotations"
      : `/annotations/${annotation.uuid}`);
  const param = {
    apiRoute,
    method: change === Change.ADD ? "POST" : "DELETE",
    data: annotation
  };

  console.log("Param:", param);
  return param;
};

const paramToSetAnnotation = getRequestParam(Change.ADD);
const paramToDeleteAnnotation = getRequestParam(Change.DELETE);
const paramToDeleteAnnotationLangtag = (cell, annotationObj, langtag) => ({
  method: "DELETE",
  apiRoute:
    route.toCell({
      tableId: cell.table.id,
      columnId: cell.column.id,
      rowId: cell.row.id
    }) +
    "/annotations/" +
    annotationObj.uuid +
    "/" +
    langtag
});

const findAnnotations = (getState, action) => {
  const { cell } = action;
  const { row, table, column } = cell;
  const state = getState();
  const rows = f.prop(["rows", table.id, "data"], state);
  const columns = f.prop(["columns", table.id, "data"], state);

  const rowIdx = f.findIndex(f.propEq("id", row.id), rows);
  const colIdx = f.findIndex(f.propEq("id", column.id), columns);
  const annotations = f.propOr([], [rowIdx, "annotations", colIdx], rows);

  return {
    rowIdx,
    colIdx,
    annotations
  };
};

export const removeAnnotationLangtags = modifyAnnotationLangtags(Change.REMOVE);
export const addAnnotationLangtags = modifyAnnotationLangtags(Change.ADD);
export const removeTextAnnotation = setTextAnnotation(Change.REMOVE);
export const addTextAnnotation = setTextAnnotation(Change.ADD);

export const setRowFlag = action => dispatch => {
  const { table, row, flagName, flagValue, onError, onSuccess } = action;
  makeRequest({
    apiRoute:
      route.toRow({ tableId: table.id, rowId: row.id }) + "/annotations",
    method: "PATCH",
    data: { [flagName]: flagValue }
  })
    .then(result =>
      dispatch({
        type: SET_ROW_ANNOTATION,
        table,
        row,
        flagName,
        flagValue: f.prop(flagName, result),
        onError,
        onSuccess
      })
    )
    .catch(console.error);
};

export const setAllRowsFinal = table => dispatch => {
  makeRequest({
    apiRoute: route.toRows(table.id) + "/annotations",
    method: "PATCH",
    data: { final: true }
  })
    .then(result =>
      dispatch({
        type: SET_ROWS_ANNOTATION,
        table,
        result
      })
    )
    .catch(console.error);
};

export const toggleAnnotationFlag = action => (dispatch, getState) => {
  const { cell, annotation, onError, onSuccess } = action;
  const { rowIdx, colIdx, annotations } = findAnnotations(getState, action);
  const existingAnnotation = annotations.find(
    ann => ann.type === "flag" && ann.value === annotation.value
  );

  const shouldDelete = f.isBoolean(annotation.setTo)
    ? annotation.setTo
    : !!existingAnnotation;

  console.log(
    "toggleAnnotationFlag",
    action,
    "existingAnnotation",
    existingAnnotation,
    "shouldDelete?",
    shouldDelete
  );

  const description = {
    promise: makeRequest(
      shouldDelete
        ? paramToDeleteAnnotation(cell, existingAnnotation)
        : paramToSetAnnotation(cell, annotation)
    ),
    actionTypes: [
      shouldDelete ? REMOVE_CELL_ANNOTATION : SET_CELL_ANNOTATION,
      shouldDelete ? "DO_NOTHING" : SET_CELL_ANNOTATION, // on new annotations set uuid
      SET_ANNOTATION_ERROR
    ],
    annotation: existingAnnotation || annotation,
    annotations,
    cell,
    rowIdx,
    colIdx,
    onError,
    onSuccess
  };
  dispatch(description);
};
