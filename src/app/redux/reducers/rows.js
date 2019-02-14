import f from "lodash/fp";

import { addCellId } from "../../helpers/getCellId";
import { idsToIndices, calcConcatValues } from "../redux-helpers";
import { when } from "../../helpers/functools";
import actionTypes from "../actionTypes";

const {
  ALL_ROWS_LOADING_DATA,
  ALL_ROWS_DATA_LOADED,
  ALL_ROWS_DATA_LOAD_ERROR,
  ADDITIONAL_ROWS_DATA_LOADED,
  CELL_SET_VALUE,
  CELL_ROLLBACK_VALUE,
  CELL_SAVED_SUCCESSFULLY,
  SET_CELL_ANNOTATION,
  REMOVE_CELL_ANNOTATION,
  ANNOTATION_ERROR
} = actionTypes;

const initialState = {};

const maybeUpdateConcats = (rows, action, completeState) => {
  const concatValues = calcConcatValues(action, completeState) || {};
  const { rowIdx, updatedConcatValue } = concatValues;
  const { tableId } = action;

  return f.isEmpty(concatValues)
    ? f.assoc([tableId, "data", rowIdx, 0], updatedConcatValue, rows)
    : rows;
};

const insertSkeletonRows = (state, action, completeState) => {
  const { tableId } = action;
  const table = f.prop(["tables", "data", tableId], completeState);
  const columns = f.prop(["columns", tableId, "data"], completeState);
  const rows = rowValuesToCells(table, columns)(action.rows);
  const hasRows = f.isArray(f.prop([tableId]));
  const pathToData = [tableId, "data"];
  return hasRows
    ? f.flow(
        f.append(f.__, state[tableId]),
        f.uniqBy(f.prop("id")),
        f.assoc(pathToData, f.__, state)
      )(rows)
    : f.assoc(pathToData, rows, state);
};

const annotationsToObject = annotations => {
  const annObj =
    annotations &&
    annotations.reduce((obj, { type, value, langtags, uuid, createdAt }) => {
      if (type === "flag") {
        const key = when(
          f.eq("needs_translation"),
          () => "translationNeeded",
          value
        );
        obj[key] = {
          createdAt,
          uuid,
          type,
          ...(langtags ? { langtags } : { value: true })
        };
      } else {
        const _value = { value, uuid, createdAt, type };
        obj[type] = f.isEmpty(obj[type]) ? [_value] : [...obj[type], _value];
      }
      return obj;
    }, {});
  return annObj;
};

const rowValuesToCells = (table, columns) => rows => {
  const start = performance.now();
  const rowsWithCells = rows.map(row => {
    const fakeRow = { id: row.id };
    return {
      id: row.id,
      final: row.final,
      annotations: row.annotations,
      values: row.values,
      cells: row.values.map((cellValue, idx) =>
        addCellId({
          kind: columns[idx].kind,
          column: columns[idx],
          table,
          row: fakeRow,
          annotations:
            row.annotations && annotationsToObject(row.annotations[idx])
        })
      )
    };
  });
  console.log(
    `rowValuesToCells(${table.id}) took ${performance.now() - start}ms`
  );
  return rowsWithCells;
};

const updateCellAnnotation = (state, action, completeState) => {
  const { cell, rowIdx, colIdx, newCellAnnotations } = action;
  const columns = completeState.columns[cell.table.id].data;
  const row = completeState.rows[cell.table.id].data[rowIdx];

  const newRow = f.first(
    rowValuesToCells(cell.table, columns)([
      f.assoc(["annotations", colIdx], newCellAnnotations, row)
    ])
  );

  return f.assoc([cell.table.id, "data", rowIdx], newRow, completeState.rows);
};

const removeCellAnnotation = (state, action, completeState) => {
  const { annotations, annotation } = action;
  console.log("Should delete", annotation, "from", annotations);
  const newCellAnnotations = f.reject(
    f.propEq("uuid", annotation.uuid),
    annotations
  );
  return updateCellAnnotation(
    state,
    { ...action, newCellAnnotations },
    completeState
  );
};

const setCellAnnotation = (state, action, completeState) => {
  const { annotations, result } = action;
  const annotation = result || action.annotation;
  const annotationIdx = f.findIndex(
    f.propEq("uuid", annotation.uuid),
    annotations
  );
  const newCellAnnotations =
    annotationIdx >= 0
      ? f.assoc(annotationIdx, annotation, annotations)
      : [...annotations, annotation];
  console.log("Result:", result);
  console.log("annotation:", annotation);
  console.log("annotations:", annotations);
  console.log("newcellannotations:", newCellAnnotations);
  return updateCellAnnotation(
    state,
    { ...action, newCellAnnotations },
    completeState
  );
};

const rows = (state = initialState, action, completeState) => {
  switch (action.type) {
    case ALL_ROWS_LOADING_DATA:
      return {
        ...state,
        [action.tableId]: { error: false, finishedLoading: false }
      };
    case ALL_ROWS_DATA_LOADED: {
      const columns = f.prop(
        ["columns", action.tableId, "data"],
        completeState
      );
      const table = f.prop(["tables", "data", action.tableId], completeState);
      return {
        ...state,
        [action.tableId]: {
          error: false,
          finishedLoading: true,
          data: rowValuesToCells(table, columns)(action.result.rows)
        }
      };
    }
    case ALL_ROWS_DATA_LOAD_ERROR:
      return {
        ...state,
        [action.tableId]: { error: action.error, finishedLoading: true }
      };
    case ADDITIONAL_ROWS_DATA_LOADED:
      return insertSkeletonRows(state, action, completeState);
    case CELL_SET_VALUE: {
      const [rowIdx, columnIdx] = idsToIndices(action, completeState);
      const rowSelector = [action.tableId, "data", rowIdx, "values"];
      return f.update(rowSelector, f.assoc(columnIdx, action.newValue), state);
    }
    case SET_CELL_ANNOTATION:
      return setCellAnnotation(state, action, completeState);
    case REMOVE_CELL_ANNOTATION:
      return removeCellAnnotation(state, action, completeState);
    case ANNOTATION_ERROR:
      return setCellAnnotation(
        state,
        { ...action, response: action.annotation },
        completeState
      );
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
