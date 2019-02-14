import f from "lodash/fp";

import ActionTypes from "../actionTypes.js";
import { makeRequest } from "../../helpers/apiHelper";
import { when } from "../../helpers/functools";
import route from "../../helpers/apiRoutes";

const Change = { ADD: "ADD", DELETE: "DELETE" };
const {
  SET_CELL_ANNOTATION,
  REMOVE_CELL_ANNOTATION,
  SET_ANNOTATION_ERROR
} = ActionTypes;

const modifyAnnotationLangtags = change => action => (dispatch, getState) => {
  const { cell, annotation } = action;
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

  console.log(
    "modifyAnnotationlangtags()",
    action,
    "langtags",
    langtags,
    "change",
    change,
    "existingAnnotation",
    existingAnnotation
  );

  dispatch({
    promise: makeRequest(
      f.isEmpty(langtags) || action.setTo === false
        ? paramToDeleteAnnotation(cell, existingAnnotation)
        : paramToSetAnnotation(cell, annotation)
    ),
    actionTypes: [
      f.isEmpty(langtags) ? REMOVE_CELL_ANNOTATION : SET_CELL_ANNOTATION,
      "NOTHING_TO_DO", // annotation got either deleted or modified, uuid unchanged
      SET_ANNOTATION_ERROR
    ],
    annotation: existingAnnotation || annotation,
    annotations,
    cell,
    rowIdx,
    colIdx
  });
};

const setTextAnnotation = change => action => (dispatch, getState) => {
  const { cell, annotation } = action;
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
    colIdx
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

export const toggleAnnotationFlag = action => (dispatch, getState) => {
  const { cell, annotation } = action;
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
    colIdx
  };
  dispatch(description);
};
