import f from "lodash/fp";

import { addCellId } from "../../helpers/getCellId";
import { doto, when } from "../../helpers/functools";
import { idsToIndices, calcConcatValues } from "../redux-helpers";
import actionTypes from "../actionTypes";

const {
  ALL_ROWS_LOADING_DATA,
  ALL_ROWS_DATA_LOADED,
  ALL_ROWS_DATA_LOAD_ERROR,
  ADDITIONAL_ROWS_DATA_LOADED,
  DELETE_ROW,
  CELL_SET_VALUE,
  CELL_ROLLBACK_VALUE,
  CELL_SAVED_SUCCESSFULLY,
  SET_CELL_ANNOTATION,
  SET_ROW_ANNOTATION,
  SET_ALL_ROWS_FINAL,
  REMOVE_CELL_ANNOTATION,
  ANNOTATION_ERROR,
  CLEAN_UP,
  ADD_ROWS,
  ROW_CREATE_SUCCESS
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
  const existingRows = f.prop(["rows", tableId, "data"], completeState);
  const hasRows = f.isArray(existingRows);
  const pathToData = [tableId, "data"];
  const skeletonRows = hasRows
    ? f.flow(
        newRows => [...existingRows, ...newRows],
        f.uniqBy(f.prop("id")),
        f.assoc(pathToData, f.__, state)
      )(rows)
    : f.assoc(pathToData, rows, state);
  return f.flow(
    f.assoc([tableId, "finishedLoading"], true),
    f.assoc([tableId, "error"], false)
  )(skeletonRows);
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
  const annotation = result && !f.isArray(result) ? result : action.annotation;
  const annotationIdx = f.findIndex(
    f.propEq("uuid", annotation.uuid),
    annotations
  );
  const newCellAnnotations =
    annotationIdx >= 0
      ? f.assoc(annotationIdx, annotation, annotations)
      : [...annotations, annotation];
  return updateCellAnnotation(
    state,
    { ...action, newCellAnnotations },
    completeState
  );
};

const deleteRow = (action, state) => {
  const { table, row } = action;
  return f.update([table.id, "data"], f.remove(f.propEq("id", row.id)), state);
};

const addRows = (completeState, state, action) => {
  const columns = f.prop(["columns", action.tableId, "data"], completeState);
  const table = f.prop(["tables", "data", action.tableId], completeState);
  const temp = f.update(
    [action.tableId, "data"],
    arr => insert(arr, rowValuesToCells(table, columns)(action.rows)),
    state
  );
  return temp;
};

const insert = (prev, rows) => {
  const firstElement = f.first(rows);
  const index = f.sortedIndexBy(f.get("id"), firstElement, prev);
  if (index === 0) {
    return rows;
  } else {
    return f.concat(
      f.concat(f.slice(0, index, prev), rows),
      f.slice(index, prev.length, prev)
    );
  }
};

const rows = (state = initialState, action, completeState) => {
  switch (action.type) {
    case ALL_ROWS_LOADING_DATA:
      return {
        [action.tableId]: { error: false, finishedLoading: false }
      };
    case ALL_ROWS_DATA_LOADED: {
      return f.update([action.tableId, "finishedLoading"], () => true, state);
    }
    case ALL_ROWS_DATA_LOAD_ERROR:
      return {
        [action.tableId]: { error: action.error, finishedLoading: true }
      };
    case ADDITIONAL_ROWS_DATA_LOADED:
      return insertSkeletonRows(state, action, completeState);
    case DELETE_ROW:
      return deleteRow(action, state);
    case CELL_SET_VALUE: {
      const [rowIdx, columnIdx] = idsToIndices(action, completeState);
      const rowSelector = [action.tableId, "data", rowIdx, "values"];
      return f.update(rowSelector, f.assoc(columnIdx, action.newValue), state);
    }
    case SET_CELL_ANNOTATION:
      return setCellAnnotation(state, action, completeState);
    case REMOVE_CELL_ANNOTATION:
      return removeCellAnnotation(state, action, completeState);
    case SET_ROW_ANNOTATION: {
      const { table, row, flagName, flagValue } = action;
      const rowIdx = doto(
        state,
        f.prop([table.id, "data"]),
        f.findIndex(f.propEq("id", row.id))
      );
      return f.update(
        [table.id, "data", rowIdx],
        f.assoc(flagName, flagValue),
        state
      );
    }
    case SET_ALL_ROWS_FINAL: {
      const { table } = action;
      return f.update([table.id, "data"], f.map(f.assoc("final", true)), state);
    }
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
    case CLEAN_UP:
      return {};
    case ADD_ROWS:
      return addRows(completeState, state, action);
    case ROW_CREATE_SUCCESS:
      return addRows(completeState, state, {
        tableId: action.tableId,
        rows: [action.result]
      });
    default:
      return state;
  }
};

export default rows;
