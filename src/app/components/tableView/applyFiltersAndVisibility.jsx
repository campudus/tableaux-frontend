import f from "lodash/fp";
import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { ShowArchived } from "../../archivedRows";
import { ColumnKinds } from "../../constants/TableauxConstants";
import DVWorkerCtl from "../../helpers/DisplayValueWorkerControls";
import { maybe } from "../../helpers/functools";
import * as t from "../../helpers/transduce";
import { selectShowArchivedState } from "../../redux/reducers/tableView";
import getFilteredRows, { completeRowInformation } from "../table/RowFilters";

const withFiltersAndVisibility = Component => props => {
  const showArchived = useSelector(selectShowArchivedState);
  const { tables, rows, columns, colsWithMatches } = props;
  const shouldLaunchDisplayValueWorker = DVWorkerCtl.shouldStartForTable(props);
  useEffect(() => {
    if (shouldLaunchDisplayValueWorker) {
      DVWorkerCtl.startForTable(props);
    }
  }, [shouldLaunchDisplayValueWorker]);

  const selectedCell = useSelector(state => state.selectedCell?.selectedCell);
  const groupMemberIds = f.compose(
    xs => new Set(xs),
    f.map("id"),
    f.flatMap("groups"),
    f.filter(f.whereEq({ kind: ColumnKinds.group }))
  )(columns);
  const visibleColumnIds = maybeAddNullable(
    selectedCell?.columnId,
    f.isEmpty(colsWithMatches) ? props.visibleColumns : colsWithMatches
  ).filter(id => !groupMemberIds.has(id));

  const sortedVisibleColumns = useMemo(
    () =>
      getSortedVisibleColumns(props.columnOrdering, visibleColumnIds, columns),
    [arrayToKey(f.map("id", columns)), arrayToKey(visibleColumnIds)]
  );

  const visibleColumns = useMemo(
    () => addColumnVisibility(columns, visibleColumnIds),
    [sortedVisibleColumns]
  );

  const visibleRows = useMemo(() => {
    const filteredRowIdces = maybeAddNullable(
      selectedCell.rowId
        ? rows?.findIndex(row => row.id === selectedCell.rowId)
        : undefined,
      filterRows(props, showArchived).visibleRows ?? []
    ).filter(idx => idx >= 0);
    return filteredRowIdces.map(idx => rows[idx]);
  }, [
    arrayToKey(props.visibleRows),
    rows,
    showArchived,
    props.filters,
    props.sorting,
    f.isEmpty(props.allDisplayValues[props.table.id])
  ]);
  const visibleRowIDs = useMemo(() => f.map("id", visibleRows), [visibleRows]);

  const hasRowJumpTarget = isNotNil(selectedCell.rowId);
  const canRenderTable = f.every(f.negate(f.isNil), [tables, rows, columns]);
  const showCellJumpOverlay =
    !props.finishedLoading &&
    hasRowJumpTarget &&
    !f.find(row => row.id === selectedCell.rowId);

  if (canRenderTable) {
    return (
      <Component
        {...{
          ...props,
          columns: visibleColumns,
          rows: visibleRows,
          visibleRows: visibleRowIDs,
          canRenderTable,
          showCellJumpOverlay,
          visibleColumnOrdering: sortedVisibleColumns,
          columnOrdering: props.columnOrdering,
          visibleColumns: arrayToKey(visibleColumnIds)
        }}
      />
    );
  } else {
    return <Component {...{ ...props, canRenderTable, showCellJumpOverlay }} />;
  }
};

const shouldColumnBeVisible = (column, visibleColumnIds) =>
  f.includes(column.id, visibleColumnIds) || column.id === 0;
const addColumnVisibility = (columns = [], visibleColumnIds) =>
  columns.map(column => ({
    ...column,
    visible: shouldColumnBeVisible(column, visibleColumnIds)
  }));
const maybeAddNullable = (element, coll) =>
  maybe(element)
    .map(el => (coll.includes(el) ? coll : [el, ...coll]))
    .getOrElse(coll);
const arrayToKey = coll =>
  Array.from(coll ?? [])
    .sort()
    .join(",");
const isNotNil = f.negate(f.isNil);

const listToSet = (...fs) => list => {
  const into = (set, item) => set.add(item);
  const xform = f.compose(...fs);

  return f.reduce(xform(into), new Set(), list);
};

const getSortedVisibleColumns = (columnOrdering, visibleColumns, columns) => {
  const statusColumnIndex = f.findIndex({ kind: ColumnKinds.status }, columns);
  const visibleColumnIDs = new Set(visibleColumns);
  const hiddenColumnIDs = listToSet(
    t.filter(f.prop("hidden")),
    t.map(f.prop("id"))
  )(columns);

  const isVisibleColumnId = id =>
    visibleColumnIDs.has(id) && !hiddenColumnIDs.has(id);

  const orderVisible = t.transduceList(
    t.filter(val => isVisibleColumnId(val.id)),
    t.map(f.prop("idx"))
  );

  const rejectDuplicateStatusColumn = f.compose(
    f.concat([statusColumnIndex]),
    f.reject(val => val === statusColumnIndex)
  );

  return f.compose(
    orderedVisible =>
      statusColumnIndex !== -1
        ? rejectDuplicateStatusColumn(orderedVisible)
        : orderedVisible,
    orderVisible
  )(columnOrdering);
};

const filterRows = (
  {
    filters,
    sorting,
    rows,
    table,
    langtag,
    columns,
    allDisplayValues,
    actions: { setColumnsVisible }
  },
  showArchived
) => {
  const nothingToFilter =
    f.isEmpty(sorting) &&
    f.isEmpty(filters) &&
    showArchived === ShowArchived.show;
  if (f.isNil(rows) || f.isEmpty(allDisplayValues) || nothingToFilter) {
    return {
      visibleRows: f.range(0, f.size(rows)),
      filtering: false
    };
  }
  const isFilterEmpty = filter =>
    f.isEmpty(filter.value) && !f.isString(filter.mode);

  const rowsFilter = {
    sortColumnId: sorting.columnId,
    sortValue: sorting.value,
    filters: f.reject(isFilterEmpty, filters),
    showArchived
  };
  const rowsWithIndex = completeRowInformation(
    columns,
    table,
    rows,
    allDisplayValues
  );
  const { visibleRows, colsWithMatches } = getFilteredRows(
    table,
    rowsWithIndex,
    columns,
    langtag,
    rowsFilter
  );
  if (!f.isEmpty(colsWithMatches)) {
    setColumnsVisible(colsWithMatches);
  }
  return { visibleRows, filtering: false };
};

export default withFiltersAndVisibility;
