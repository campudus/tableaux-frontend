// @flow

import type {
  DependencyMap,
  Transducer,
  Cell,
  Column,
  ColumnDataState,
  RowDataState,
  TableViewDataState,
  ReduxTableData,
  Value,
  TableId,
  ColumnId,
  RowId
} from "./redux.flowtypes";
import { unless, when } from "../helpers/functools";

type Link = "link";

import f from "lodash/fp";

import { ColumnKinds } from "../constants/TableauxConstants";
import { memoizeWith } from "../helpers/functools";

export const calcColumnDependencies = (
  columnCollection: ColumnDataState
): DependencyMap => {
  const filterLinkColumns = ([tableId, { data }]) => [
    f.parseInt(10, tableId),
    f.filter(isLinkColumn, data)
  ];

  const extractToTables = ([tableId, data]) =>
    f.map(({ id, toTable }) => ({ tableId, toTable, columnId: id }), data);

  const toDependencyMap: ({
    tableId: TableId,
    columnId: ColumnId,
    toTable: TableId
  }) => DependencyMap = f.reduce((accum, { tableId, toTable, columnId }) => {
    accum[toTable] = accum[toTable] || {};
    const existingColumns = accum[toTable][tableId];
    accum[toTable][tableId] = existingColumns
      ? [...existingColumns, columnId]
      : [columnId];
    return accum;
  }, {});

  return f.compose(
    toDependencyMap,
    f.flatMap(extractToTables),
    f.map(filterLinkColumns),
    f.toPairs
  )(columnCollection);
};

const hasTransientDependency = (a: TableId, b: TableId) => {};

const listOfTableIds = f.compose(
  f.join(","),
  f.sortBy(f.identity),
  f.keys
);

const getCachedDependencyMap: ColumnDataState => DependencyMap = memoizeWith(
  listOfTableIds,
  calcColumnDependencies
);

const isLinkColumn = f.propEq("kind", ColumnKinds.link);

export const performRowDeletion = (
  tableId: number,
  rowId: number,
  state: ReduxTableData
): ReduxTableData => {
  const dependencies = getCachedDependencyMap(state.columns);

  const removeRowFromState: Transducer<ReduxTableData> = f.update(
    ["rows", tableId, "data"],
    f.remove(f.propEq("id", rowId))
  );

  const hasDependants: () => boolean = () => !f.isEmpty(dependencies[tableId]);

  return (
    state
    |> removeRowFromState
    |> when(hasDependants, propagateRowDelete(tableId, rowId))
  );
};

const nativeClone = value => value |> JSON.stringify |> JSON.parse;

export const propagateRowDelete = f.curryN(
  3,
  (originTableId: TableId, originRowId: RowId, state: ReduxTableData) => {
    const updatedRows = nativeClone(state.rows);
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

    return updatedRows;
  }
);

/**
 * Propagates a cell display value change to all elements that link to
 * the original cell.
 * @param state: ReduxTableData Complete redux state
 * @param cell: Cell The cell that introduced the original change
 * @param changeFn: Function that will be applied to link cells'
 *           values. Should either be identity or a link cell modifier.
 * @return { rows, tableView } Updated rows and display values after
 *           propagation
 */
// Closures inside this function are mutative for sake of
// performance. Don't refactor them out of the function body!
export const propagateCellChange = (
  state: ReduxTableData,
  cell: Cell,
  changeFn: Transducer<Value<Link>>
): { rows: RowDataState, tableView: TableViewDataState } => {
  const clonedState = nativeClone(state);
  const dependencyMap = getCachedDependencyMap(state.columns);

  const getCellValue = (tableId, columnIdx, rowIdx, _state = clonedState) =>
    _state.rows[tableId].data[rowIdx].values[columnIdx];
  const updateCellValue = (tableId, columnIdx, rowIdx, updateFn) => {
    const updatedValue = updateFn(getCellValue(tableId, columnIdx, rowIdx));

    clonedState.rows[tableId].data[rowIdx].values[columnIdx] = updatedValue;
    return updatedValue;
  };

  const updateDisplayValue = (tableId, columnIdx, rowId, value) => {};

  const getColumnIdx = (tableId: TableId, columnId: ColumnId): number =>
    f.findIndex(f.propEq("id", columnId), state.columns[tableId].data);

  const getColumnAt = (tableId: TableId, columnIdx: number): Column =>
    state.columns[tableId].data[columnIdx];

  const updateConcatCell = (tableId: TableId, rowIdx: number): void => {
    const columns = state.columns[tableId].data;
    const concatColumn = f.head(columns);
    if (concatColumn.kind !== "concat") return;
    const concatIndices =
      concatColumn
      |> f.map("id")
      |> f.map(id => f.findIndex(f.propEq("id", id), columns));

    const concatValue = concatColumn.concats.map((column, idx) =>
      getCellValue(tableId, concatIndices[idx], rowIdx)
    );
  };

  const __updateCellsInPlace = (
    linkedTables: [{ tableId: TableId, columns: [ColumnId] }],
    changedRows: [RowId],
    calcNewCellValue: Transducer<Value<Link>>
  ) => {
    const _changedRows = [];
    const _affectedTables = [];
    linkedTables.forEach(({ tableId, columns }) => {
      columns.forEach(columnId => {
        const columnIdx = getColumnIdx(tableId, columnId);
        state.rows[tableId].data
          |> f.keys
          |> (arr =>
            arr.forEach((rowId, rowIdx) => {
              // skip links without modified target
              if (
                !f.contains(
                  rowId,
                  getCellValue(tableId, rowIdx, columnIdx, clonedState)
                )
              ) {
                return;
              }

              _changedRows.push(rowId);
              const newValue = updateCellValue(
                tableId,
                columnIdx,
                rowIdx,
                calcNewCellValue
              );
              const column = getColumnAt(tableId, columnIdx);
              if (column.identifier) {
                updateConcatCell(tableId, rowIdx, newValue);
                unless(f.isEmpty, _affectedTables.push, dependencyMap(tableId));
              }
            }));
        if (!f.isEmpty(_affectedTables)) {
          __updateCellsInPlace(_affectedTables, _changedRows, f.identity);
        }
      });
    });
  };

  const primaryDependents = dependencyMap[cell.table.id];
  const linkedTables =
    primaryDependents
    |> f.map(f.toPairs)
    |> f.map(([tableId, columns]) => ({ tableId, columns }));
  return __updateCellsInPlace(linkedTables, [cell.row.id], changeFn);
};
