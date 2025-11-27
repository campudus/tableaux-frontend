import f from "lodash/fp";
import {
  buildOriginColumnLookup,
  getConcatOrigin
} from "../../helpers/columnHelper";
import { doto, when } from "../../helpers/functools";
import { addCellId } from "../../helpers/getCellId";
import actionTypes from "../actionTypes";
import {
  calcConcatValues,
  getUpdatedCellValueToSet,
  idsToIndices
} from "../redux-helpers";
import { performRowDeletion } from "../updateDependentTables";
import { ColumnKind } from "@grud/devtools/types";

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
  ROW_CREATE_SUCCESS,
  SET_STATE
} = actionTypes;

const initialState = {};

const maybeUpdateConcats = (rows, action, completeState) => {
  const concatValues = calcConcatValues(action, completeState) || {};
  const { columnIdx, rowIdx, updatedConcatValue } = concatValues;
  const { tableId } = action;

  return f.isEmpty(concatValues)
    ? rows
    : f.assoc(
        [tableId, "data", rowIdx, "values", columnIdx],
        updatedConcatValue,
        rows
      );
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
        if (!f.isNil(key)) {
          obj[key] = {
            createdAt,
            uuid,
            type,
            ...(langtags ? { langtags } : { value: true })
          };
        }
      } else {
        const _value = { value, uuid, createdAt, type };
        obj[type] = f.isEmpty(obj[type]) ? [_value] : [...obj[type], _value];
      }
      return obj;
    }, {});
  return annObj;
};

export const rowValuesToCells = (table, columns) => {
  const getOriginColumn = buildOriginColumnLookup(table, columns);
  return rows => {
    const buildCell = row => (_, idx) => {
      const column = columns[idx];
      const originColumn = getOriginColumn(column.id, row.tableId);

      const updatedColumn =
        column.kind === ColumnKind.concat
          ? getConcatOrigin(table.id, column, row.tableId)
          : originColumn
          ? { ...column, originColumn }
          : column;
      return addCellId({
        table,
        kind: column?.kind,
        column: updatedColumn,
        row: { id: row.id, tableId: row.tableId },
        annotations:
          row.annotations && annotationsToObject(row.annotations[idx])
      });
    };
    return rows.map(row => ({
      id: row.id,
      tableId: row.tableId,
      rowId: row.id,
      final: row.final,
      archived: row.archived,
      annotations: row.annotations,
      values: row.values,
      cells: row.values.map(buildCell(row))
    }));
  };
};

const updateCellAnnotation = (state, action, completeState) => {
  const { cell, rowIdx, colIdx, newCellAnnotations } = action;
  const columns = completeState.columns[cell.table.id].data;
  const row = completeState.rows[cell.table.id].data[rowIdx];

  const newRow = f.first(
    rowValuesToCells(
      cell.table,
      columns
    )([f.assoc(["annotations", colIdx], newCellAnnotations, row)])
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
      : [...(annotations || []), annotation];
  return updateCellAnnotation(
    state,
    { ...action, newCellAnnotations },
    completeState
  );
};

const deleteRow = (action, completeState) => {
  const { tableId, rowId } = action;
  return performRowDeletion(tableId, rowId, completeState);
};

const addRows = (completeState, state, action) => {
  const columns = f.prop(["columns", action.tableId, "data"], completeState);
  const table = f.prop(["tables", "data", action.tableId], completeState);
  const newRows = rowValuesToCells(table, columns)(action.rows);
  const temp = f.update(
    [action.tableId, "data"],
    mergeRows(newRows || []),
    state
  );
  return temp;
};

// JavaScript would be very slow and/or run out of stack if we'd implement that
// cleanly.
const mergeRows = a => b => {
  const rowsA = f.sortBy("id", a);
  const rowsB = f.sortBy("id", b);
  const rows = [];

  while (rowsA.length > 0 || rowsB.length > 0) {
    const headA = rowsA[0];
    const headB = rowsB[0];
    switch (true) {
      case headA && !headB:
        return f.uniqBy("id", rows.concat(rowsA)); // recursion base
      case headB && !headA:
        return f.uniqBy("id", rows.concat(rowsB)); // recursion base
      case headA.id < headB.id:
        rows.push(rowsA.shift()); // multiple mutation, simulate recursion
        break; // recur
      case headA.id >= headB.id:
        rows.push(rowsB.shift()); // multiple mutation, simulate recursion
        break; // recur
    }
  }
  return f.uniqBy("id", rows); // remote return and/or recursion base
};

const setCellValue = (state, action, completeState, isRollback = false) => {
  const [rowIdx, columnIdx] = idsToIndices(action, completeState);
  const rowSelector = [action.tableId, "data", rowIdx, "values"];
  const valueToSet = getUpdatedCellValueToSet(action, isRollback);

  return f.update(rowSelector, f.assoc(columnIdx, valueToSet), state);
};

const rows = (state = initialState, action, completeState) => {
  switch (action.type) {
    case SET_STATE:
      return action.state.rows;
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
      return deleteRow(action, completeState);
    case CELL_SET_VALUE:
      return setCellValue(state, action, completeState, false /*isRollback*/);
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
    case CELL_ROLLBACK_VALUE:
      return setCellValue(state, action, completeState, true /*isRollback*/);
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
