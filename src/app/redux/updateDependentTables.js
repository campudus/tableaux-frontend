// @flow

import f from "lodash/fp";
import { set } from "lodash"; // eslint-disable-line

import { ColumnKinds } from "../constants/TableauxConstants";
import {
  doto,
  mapIndexed,
  mapPromise,
  memoizeWith,
  when
} from "../helpers/functools";
import { makeRequest } from "../helpers/apiHelper";
import getDisplayValue from "../helpers/getDisplayValue";
import route from "../helpers/apiRoutes.js";

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

const listOfTableIds = f.compose(
  f.join(","),
  f.sortBy(f.identity),
  f.keys
);

const getCachedDependencyMap = memoizeWith(
  listOfTableIds,
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

export const hasTransitiveDependencies = (tableId, state) => {
  const dependencies = getCachedDependencyMap(state);
  const primaryDependencies = doto(dependencies[tableId], f.keys);
  const transitiveDependencies = doto(
    primaryDependencies,
    f.map(tblId => dependencies[tblId]),
    f.reject(f.isEmpty)
  );
  return !f.isEmpty(transitiveDependencies);
};

// This function mutates the global state object, but it shouldnt pose a problem as we replace the
// whole state anyway afterwards
export const refreshDependentRows = async (
  changeOrigin,
  changedRows,
  state
) => {
  const dependentTables = getCachedDependencyMap(state.columns);
  if (f.isEmpty(dependentTables[changeOrigin])) return state;

  const clonedState = { ...state };
  const refreshedTables = new Set();

  const fetchChangedRows = async (tableId, parentTable, changedParentRows) => {
    // assure we terminate in case of cyclic links
    if (refreshedTables.has(tableId)) {
      return;
    }
    refreshedTables.add(tableId);

    const columns = state.columns[tableId].data;
    const linkColumnIndices = doto(
      columns,
      mapIndexed((column, idx) => ({ ...column, idx })),
      f.filter(f.propEq("toTable", parentTable)),
      f.map("idx")
    );
    const getLinkCellValues = row =>
      f.flatMap(
        idx => doto(f.nth(idx, row.values), f.map(f.prop("id"))),
        linkColumnIndices
      );
    const linksToChangedRow = row =>
      doto(row, getLinkCellValues, f.any(f.contains(f.__, changedParentRows)));
    const rowsToUpdate = f
      .propOr([], ["rows", tableId, "data"], clonedState)
      .filter(linksToChangedRow);
    const fetchRows = mapPromise(({ id }) =>
      makeRequest({ apiRoute: route.toRow({ tableId, rowId: id }) })
    );
    const freshRows = await fetchRows(rowsToUpdate);
    const freshDisplayValues = freshRows.map(({ values }) =>
      mapIndexed(
        (cellValue, idx) => getDisplayValue(columns[idx], cellValue),
        values
      )
    );

    freshRows.forEach((row, ii) => {
      // Here be mutations!
      const rowIdx = f.findIndex(
        f.propEq("id", row.id),
        state.rows[tableId].data
      );
      const pathToRow = ["rows", tableId, "data", rowIdx];
      if (!f.prop(pathToRow, clonedState)) {
        set(clonedState, pathToRow, {}); // eslint-disable-line
      }
      clonedState.rows[tableId].data[rowIdx].values = row.values;
      const dvIdx = f.findIndex(
        f.propEq("id", row.id),
        state.tableView.displayValues[tableId]
      );

      const pathToDisplayValue = ["tableView", "displayValues", tableId, dvIdx];
      if (!f.prop(pathToDisplayValue, clonedState)) {
        set(clonedState, pathToDisplayValue, {}); // eslint-disable-line
      }
      clonedState.tableView.displayValues[tableId][dvIdx].values =
        freshDisplayValues[ii];
    });

    const subDependencies = dependentTables[tableId];
    return doto(
      subDependencies,
      f.keys,
      f.filter(tblId => hasTransitiveDependencies(tblId, state.columns)),
      mapPromise(tblId =>
        fetchChangedRows(tblId, tableId, rowsToUpdate.map(f.prop("id")))
      )
    );
  };

  if (hasTransitiveDependencies(changeOrigin, state.columns)) {
    await mapPromise(
      tableId => fetchChangedRows(tableId, changeOrigin, changedRows),
      f.keys(dependentTables[changeOrigin])
    );
  }
  return clonedState;
};
