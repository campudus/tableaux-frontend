import f from "lodash/fp";

import { ColumnKinds } from "../constants/TableauxConstants";
import { doto, memoizeWith, merge } from "../helpers/functools";
import getDisplayValue from "../helpers/getDisplayValue";
import store from "./store";

/**
 * @params { tableId, columnId, rowId }
 * @returns [rowIndex, columnIndex, displayValueColumnIndex]
 */
export const idsToIndices = (
  { tableId, columnId, rowId } = {},
  completeState
) => {
  try {
    const rowIdx = f.findIndex(
      row => row.id === rowId,
      f.prop(["rows", tableId, "data"], completeState)
    );
    const columnIdx = f.findIndex(
      col => col.id === columnId,
      f.prop(["columns", tableId, "data"], completeState)
    );
    const displayValueColumnIdx = f.findIndex(
      row => row.id === rowId,
      f.prop(["tableView", "displayValues", tableId], completeState)
    );
    return [rowIdx, columnIdx, displayValueColumnIdx];
  } catch (err) {
    console.error(
      "Redux helper: could not calculate indices for table",
      tableId,
      "row",
      rowId,
      "column",
      columnId,
      err
    );
    return [-1, -1, -1];
  }
};

export const getCellByIds = (ids, state) => {
  const [rowIdx, columnIdx] = idsToIndices(ids, state);
  const row = f.prop(`rows.${ids.tableId}.data.${rowIdx}`, state);
  const value = f.prop(`values.${columnIdx}`, row);
  const cell = f.prop(`cells.${columnIdx}`, row);
  return { ...cell, value };
};

export const tableColumnKey = arg => {
  const [tableId, columnId] = f.props(["tableId", ["column", "id"]], arg);
  return f.every(f.isNil, [tableId, columnId])
    ? null
    : `${tableId}-${columnId}`;
};

export const isGroupMember = memoizeWith(
  tableColumnKey,
  ({ tableId, column, completeState }) => {
    const columns = completeState.columns[tableId].data;
    const groupMemberIds = doto(
      columns,
      f.map(f.flow(f.prop("groups"), f.map("id"))),
      f.reject(f.isEmpty),
      f.flatten
    );
    return f.contains(column.id, groupMemberIds);
  }
);

const columnsOf = (tableId, completeState) =>
  f.propOr([], ["columns", tableId, "data"], completeState);

// Keyed on the columns array, not the table id: that never changes, so a group
// created or edited mid-session stayed invisible for the rest of the session.
export const getGroupLookup = memoizeWith(
  f.identity,
  // column[] -> { [groupMemberId]: groupColumnId[] }, a column may be a member
  // of more than one group
  columns =>
    columns.reduce(
      (theMap, column) =>
        (column.groups || []).reduce((acc, member) => {
          acc[member.id] = [...(acc[member.id] || []), column.id];
          return acc;
        }, theMap),
      {}
    )
);

export const getGroupColumnIds = (data, completeState) =>
  f.propOr(
    [],
    data.column.id,
    getGroupLookup(columnsOf(data.tableId, completeState))
  );

// The columns of the changed row that carry a copy of the changed value: the
// concat at index 0 if the changed column is an identifier, and every group it
// is a member of. Independent of each other -- a column that is both used to
// get its group patched and its concat skipped.
export const calcDependentValues = (
  action,
  completeState,
  isRollback = false
) => {
  const { tableId, columnId, column } = action;
  const [rowIdx, _columnIdx, dvRowIdx] = idsToIndices(action, completeState);
  const columns = columnsOf(tableId, completeState);
  const rows = f.propOr([], ["rows", tableId, "data"], completeState);

  if (!column || rowIdx < 0 || f.isEmpty(columns)) {
    return [];
  }

  const newValue = getUpdatedCellValueToSet(action, isRollback);

  const dependentColumnIdcs = [
    ...(column.identifier && columns[0].kind === ColumnKinds.concat ? [0] : []),
    ...getGroupColumnIds(action, completeState).map(groupColumnId =>
      columns.findIndex(f.propEq("id", groupColumnId))
    )
  ];

  return dependentColumnIdcs.reduce((updates, dependentColumnIdx) => {
    const dependentColumn = columns[dependentColumnIdx];
    const members = f.propOr(
      f.propOr([], "groups", dependentColumn),
      "concats",
      dependentColumn
    );
    const entryIdx = f.findIndex(f.propEq("id", columnId), members);
    const dependentValue = f.prop(["values", dependentColumnIdx], rows[rowIdx]);

    // Nothing to patch -- f.assoc(-1, ...) would add a stray "-1" property.
    if (dependentColumnIdx < 0 || entryIdx < 0 || !f.isArray(dependentValue)) {
      return updates;
    }

    const updatedValue = f.assoc(entryIdx, newValue, dependentValue);

    return [
      ...updates,
      {
        columnIdx: dependentColumnIdx,
        rowIdx,
        dvRowIdx,
        updatedValue,
        displayValue: getDisplayValue(dependentColumn, updatedValue)
      }
    ];
  }, []);
};

// Conditionally merge cell values for multilang updates
export const getUpdatedCellValueToSet = (
  { column, oldValue, newValue },
  isRollback = false
) => {
  const unmergeableTypes = [
    ColumnKinds.link,
    ColumnKinds.attachment,
    ColumnKinds.status
  ];
  const mergeCellValues = () =>
    !column?.multilanguage || f.contains(column?.kind, unmergeableTypes)
      ? newValue
      : merge(oldValue, newValue);
  return isRollback ? oldValue : mergeCellValues();
};

export const promisifyAction = actionCreator => (...params) =>
  new Promise((resolve, reject) => {
    const action = doto(
      actionCreator(...params),
      f.assoc("onSuccess", resolve),
      f.assoc("onError", reject)
    );
    store.dispatch(action);
    if (!action.promise) {
      console.warn("Promisified synchronous action:", action.type);
      resolve();
    }
  });
