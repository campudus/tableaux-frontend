import f from "lodash/fp";
import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { ShowArchived } from "../../archivedRows";
import DVWorkerCtl from "../../helpers/DisplayValueWorkerControls";
import { selectShowArchivedState } from "../../redux/reducers/tableView";
import { match, otherwise, when } from "match-iz";
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
    sorting = {},
    langtag,
    table
  } = props;
  const shouldLaunchDisplayValueWorker = DVWorkerCtl.shouldStartForTable(props);
  useEffect(() => {
    if (shouldLaunchDisplayValueWorker) {
      DVWorkerCtl.startForTable(props);
    }
  }, [shouldLaunchDisplayValueWorker]);

  const ctx = RowFilters.buildContext(table.id, langtag, store);

  const selectedCell = useSelector(state => state.selectedCell?.selectedCell);
  const canRenderTable = f.every(f.negate(f.isNil), [tables, rows, columns]);
  const canRenderContent = canRenderTable && !f.isNil(columns[table.id]);

  const [visibleRows, visibleColumnIDs] = useMemo(() => {
    const applyRowOrdering = canRenderContent
      ? orderRows(ctx, sorting)
      : f.identity;
    return f.compose(
      ([rs, ids]) => [applyRowOrdering(rs), ids],
      filterRows
    )(ctx, { filters, table, store });
  }, [
    arrayToKey(props.visibleRows),
    rows,
    showArchived,
    filters,
    sorting,
    canRenderContent
  ]);
  const columnsWithVisibility = columns.map((col, idx) => ({
    ...col,
    visible:
      idx === 0 ||
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

const arrayToKey = coll =>
  Array.from(coll ?? [])
    .sort()
    .join(",");
const isNotNil = f.negate(f.isNil);

const orderRows = (ctx, sorting) =>
  sorting?.colName ? sortRows(ctx, sorting) : f.identity;

const filterRows = (filterContext, { filters, table, store }) => {
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

  const filterSetting = archivedFilter
    ? f.isEmpty(filters)
      ? archivedFilter
      : ["and", archivedFilter, filters]
    : filters;

  const filterRows = filterStateful(
    RowFilters.parse(filterContext)(filterSetting),
    new Set(visibleColumnIds)
  );

  return filterRows(rows);
};

export default withFiltersAndVisibility;
