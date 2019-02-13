import f from "lodash/fp";

import {
  SET_CELL_ANNOTATION,
  REMOVE_CELL_ANNOTATION,
  ANNOTATION_ERROR
} from "../actionTypes.js";
import { makeRequest } from "../../helpers/apiHelper";
import { when } from "../../helpers/functools";
import route from "../../helpers/apiRoutes";

const Change = { ADD: "ADD", DELETE: "DELETE" };

export const removeAnnotationLangtags = modifyAnnotationLangtags(Change.REMOVE);
export const addAnnotationLangtags = modifyAnnotationLangtags(Change.ADD);
export const removeTextAnnotation = setTextAnnotation(Change.REMOVE);
export const addTextAnnotation = setTextAnnotation(Change.ADD);

export const toggleAnnotationFlag = action => (getState, dispatch) => {
  const { cell, annotation } = action;
  const { rowIdx, annotations } = findAnnotations(getState, action);
  const existingAnnotation = annotations.find(
    ann => ann.type === "flag" && ann.value === annotation.value
  );

  const shouldDelete = f.isBoolean(annotation.setTo)
    ? annotation.setTo
    : !!existingAnnotation;

  dispatch({
    promise: makeRequest(
      shouldDelete
        ? paramToDeleteAnnotation(cell, existingAnnotation)
        : paramToSetAnnotation(cell, { annotation })
    ),
    actionTypes: [
      shouldDelete ? REMOVE_CELL_ANNOTATION : SET_CELL_ANNOTATION,
      shouldDelete ? "DO_NOTHING" : SET_CELL_ANNOTATION, // on new annotations set uuid
      ANNOTATION_ERROR
    ],
    annotation,
    annotations,
    cell,
    rowIdx
  });
};

const modifyAnnotationLangtags = change => action => (getState, dispatch) => {
  const { cell, annotation } = action;
  const { rowIdx, annotations } = findAnnotations(getState, action);

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

  dispatch({
    promise: makeRequest(
      f.isEmpty(langtags)
        ? paramToDeleteAnnotation(cell, existingAnnotation)
        : paramToSetAnnotation(cell, annotation)
    ),
    actionTypes: [
      f.isEmpty(langtags) ? REMOVE_CELL_ANNOTATION : SET_CELL_ANNOTATION,
      "NOTHING_TO_DO", // annotation got either deleted or modified, uuid unchanged
      ANNOTATION_ERROR
    ],
    annotation,
    annotations,
    cell,
    rowIdx
  });
};

const setTextAnnotation = change => action => (getState, dispatch) => {
  const { cell, annotation } = action;
  const { rowIdx, annotations } = findAnnotations(getState, dispatch);
  const existingAnnotation = annotations.find(
    ann => ann.type === annotation.type && ann.uuid === annotation.uuid
  );

  const shouldDelete = change === Change.DELETE;

  dispatch({
    promise: makeRequest(
      shouldDelete
        ? paramToDeleteAnnotation(cell, existingAnnotation)
        : paramToSetAnnotation(cell, annotation)
    ),
    actionTypes: [
      shouldDelete ? REMOVE_CELL_ANNOTATION : SET_CELL_ANNOTATION,
      shouldDelete ? "DO_NOTHING" : SET_CELL_ANNOTATION,
      ANNOTATION_ERROR
    ],
    annotation,
    annotations,
    cell,
    rowIdx
  });
};

const paramToSetAnnotation = getRequestParam(Change.ADD);
const paramToDeleteAnnotation = getRequestParam(Change.DELETE);

const getRequestParam = change => (cell, annotation) => {
  const { table, row, column } = cell;
  const apiUrl =
    route.toCell({
      tableId: table.id,
      rowId: row.id,
      columnId: column.id
    }) +
    (change === Change.ADD
      ? "/annotations"
      : `/annotations/${annotation.uuid}`);
  return {
    apiUrl,
    method: change === Change.ADD ? "POST" : "DELETE",
    data: annotation
  };
};

const findAnnotations = (getState, action) => {
  const { cell } = action;
  const { row, table } = cell;
  const rows = f.prop(["rows", table.id, "data"], getState());

  const rowIdx = f.findIndex(f.propEq("id", row.id), rows);
  const annotations = f.propOr([], [rowIdx, "annotations"], rows);

  return {
    rowIdx,
    annotations
  };
};
