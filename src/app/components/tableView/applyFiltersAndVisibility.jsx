import f from "lodash/fp";
import { match, otherwise, when } from "match-iz";
import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { SortDirection } from "react-virtualized";
import { ShowArchived } from "../../archivedRows";
import { ColumnKinds } from "../../constants/TableauxConstants";
import DVWorkerCtl from "../../helpers/DisplayValueWorkerControls";
import { selectShowArchivedState } from "../../redux/reducers/tableView";
import RowFilters, { filterStateful, sortRows } from "../../RowFilters";

const withFiltersAndVisibility = Component => props => {
  const store = useSelector(x => x);
  const showArchived = selectShowArchivedState(store);
  const {
    tables,
    rows = [],
    columns = [],
    columnOrdering = [],
    filters = [],
    langtag,
    table,
    visibleColumns: customVisibleColumnIdces
  } = props;
  const shouldLaunchDisplayValueWorker = DVWorkerCtl.shouldStartForTable(props);
  useEffect(() => {
    if (shouldLaunchDisplayValueWorker) {
      DVWorkerCtl.startForTable(props);
    }
  }, [shouldLaunchDisplayValueWorker]);

  const ctx = RowFilters.buildContext(table.id, langtag, store);
  const sorting = getSorting(props.sorting, store.globalSettings?.sortingDesc);
  const workerStillRunning = store.tableView?.startedGeneratingDisplayValues;

  const selectedCell = store.selectedCell?.selectedCell;
  const canRenderTable = f.every(f.negate(f.isNil), [tables, rows, columns]);
  const canRenderContent = canRenderTable && !f.isEmpty(columns);

  const [visibleRows, visibleColumnIDs] = useMemo(() => {
    const applyRowOrdering = orderRows(ctx, sorting);

    return canRenderContent
      ? f.compose(
          ([rs, ids]) => [
            applyRowOrdering(rs),
            ids.difference(getHiddenGroupColumnIDs(columns))
          ],
          filterRows
        )(ctx, { filters, table, store, selectedRowId: selectedCell?.rowId })
      : [[], []];
  }, [
    arrayToKey(props.visibleRows),
    rows,
    showArchived,
    filters,
    sorting,
    canRenderContent,
    workerStillRunning,
    langtag,
    customVisibleColumnIdces.join(",")
  ]);
  const customVisibleColumnIDs = new Set(customVisibleColumnIdces);
  const columnsWithVisibility = columns.map((col, idx) => ({
    ...col,
    visible:
      idx === 0 ||
      customVisibleColumnIDs.has(idx) ||
      col.id === selectedCell?.columnId ||
      visibleColumnIDs.has(col.id)
  }));
  const columnIdxLookup = (columns || []).reduce((acc, col, idx) => {
    acc[col.id] = idx;
    return acc;
  }, {});
  const visibleColumnOrdering = columnOrdering
    .filter(({ idx }) => columnsWithVisibility[idx]?.visible)
    .map(({ id }) => columnIdxLookup[id]);

  const visibleRowIDs = useMemo(() => f.map("id", visibleRows), [visibleRows]);

  const hasRowJumpTarget = isNotNil(selectedCell.rowId);

  const showCellJumpOverlay =
    !props.finishedLoading &&
    hasRowJumpTarget &&
    !f.find(row => row.id === selectedCell.rowId, rows);

  if (canRenderTable) {
    return (
      <Component
        {...{
          ...props,
          columns: columnsWithVisibility,
          rows: visibleRows,
          visibleRows: visibleRowIDs,
          canRenderTable,
          showCellJumpOverlay,
          visibleColumnOrdering,
          columnOrdering: props.columnOrdering,
          visibleColumns: arrayToKey(visibleColumnIDs)
        }}
      />
    );
  } else {
    return <Component {...{ ...props, canRenderTable, showCellJumpOverlay }} />;
  }
};

const getHiddenGroupColumnIDs = columns =>
  new Set(
    columns
      .filter(col => col.kind === ColumnKinds.group && !col.showMemberColumns)
      .flatMap(col => col.groups.map(group => group.id))
  );

const getSorting = (sorting = {}, defaultIsDesc = false) =>
  !f.isEmpty(sorting)
    ? sorting
    : defaultIsDesc
    ? { colName: "rowId", direction: SortDirection.DESC }
    : {};

const arrayToKey = coll =>
  Array.from(coll ?? [])
    .sort()
    .join(",");
const isNotNil = f.negate(f.isNil);

const orderRows = (ctx, sorting) => {
  return sorting?.colName ? sortRows(ctx, sorting) : f.identity;
};

const filterRows = (
  filterContext,
  { filters, table, store, selectedRowId }
) => {
  const showArchived = selectShowArchivedState(store);
  const nothingToFilter =
    f.isEmpty(filters) && showArchived === ShowArchived.show;
  const tableId = table.id;
  const rows = store.rows[tableId]?.data || [];
  const visibleColumnIds = store.tableView.visibleColumns || [];
  const allDisplayValues = store.tableView?.displayValues || {};

  if (f.isEmpty(allDisplayValues) || nothingToFilter) {
    return [rows, new Set(visibleColumnIds)];
  }

  const archivedFilter = match(showArchived)(
    when(ShowArchived.exclusive, ["row-prop", "archived", "is-set"]),
    when(ShowArchived.hide, ["row-prop", "archived", "is-unset"]),
    otherwise(() => null)
  );

  const keepSelectedRowFilter = f.isNumber(selectedRowId)
    ? ["row-prop", "id", "equals", selectedRowId]
    : null;

  const filterSetting = match([
    !f.isEmpty(filters), // Filters set
    Boolean(archivedFilter), // Archived filter set
    Boolean(keepSelectedRowFilter) // RowId must be included
  ])(
    when(
      [true, true, true],
      ["or", keepSelectedRowFilter, ["and", archivedFilter, filters]]
    ),
    when([true, true, false], ["and", archivedFilter, filters]),
    when([true, false, true], ["or", filters, keepSelectedRowFilter]),
    when([true, false, false], filters),
    when([false, true, true], ["or", archivedFilter, keepSelectedRowFilter]),
    when([false, true, false], archivedFilter),
    when([false, false, true], [keepSelectedRowFilter]), // Only keep selected row? No filter needed
    when([false, false, false], [])
  ).filter(setting => !f.isEmpty(setting));

  const filterRows = filterStateful(
    RowFilters.parse(filterContext)(filterSetting),
    new Set(visibleColumnIds)
  );

  return filterRows(rows);
};

export default withFiltersAndVisibility;
