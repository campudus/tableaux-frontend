// @flow

import f from "lodash/fp";

import { ColumnKinds } from "../constants/TableauxConstants";
import { doto, memoizeWith, when } from "../helpers/functools";

export const calcColumnDependencies = columnCollection => {
  const filterLinkColumns = ([tableId, { data }]) => [
    f.parseInt(10, tableId),
    f.filter(isLinkColumn, data)
  ];

  const extractToTables = ([tableId, data]) =>
    f.map(({ id, toTable }) => ({ tableId, toTable, columnId: id }), data);

  const toDependencyMap = f.reduce((accum, { tableId, toTable, columnId }) => {
    accum[toTable] = accum[toTable] || {};
    const existingColumns = accum[toTable][tableId];
    accum[toTable][tableId] = existingColumns
      ? [...existingColumns, columnId]
      : [columnId];
    return accum;
  }, {});

  return doto(
    columnCollection,
    f.toPairs,
    f.map(filterLinkColumns),
    f.flatMap(extractToTables),
    toDependencyMap
  );
};

// Counts only the tables whose columns have arrived: a table registers its id
// while they still load, and the empty map computed then would be cached under
// the very key the loaded state produces later.
export const dependencyMapMemoKey = f.compose(
  f.join(","),
  f.sortBy(f.identity),
  f.keys,
  f.pickBy(f.has("data"))
);

const getCachedDependencyMap = memoizeWith(
  dependencyMapMemoKey,
  calcColumnDependencies
);

const isLinkColumn = f.propEq("kind", ColumnKinds.link);

export const performRowDeletion = (tableId, rowId, state) => {
  const dependencies = getCachedDependencyMap(state.columns);

  const removeRowFromState = f.update(
    ["rows", tableId, "data"],
    f.remove(f.propEq("id", rowId))
  );

  const hasDependants = () => !f.isEmpty(dependencies[tableId]);

  return doto(
    state,
    removeRowFromState,
    when(hasDependants, propagateRowDelete(tableId, rowId)),
    f.prop("rows")
  );
};

export const propagateRowDelete = f.curryN(
  3,
  (originTableId, originRowId, state) => {
    const updatedRows = state.rows;
    const removeLinkFrom = f.remove(f.propEq("id", originRowId));

    // in-place update
    const tableIds = f.keys(state.rows);

    tableIds.forEach(tableId => {
      if (tableId === originTableId) return;
      const columns = state.columns[tableId].data;

      columns.forEach(({ kind, toTable }, idx) => {
        const rows = state.rows[tableId].data;

        if (kind === ColumnKinds.link && toTable === originTableId) {
          rows.forEach((row, rowIdx) => {
            updatedRows[tableId].data[rowIdx].values[idx] = removeLinkFrom(
              state.rows[tableId].data[rowIdx].values[idx]
            );
          });
        }
      });
    });
    return { rows: updatedRows };
  }
);
