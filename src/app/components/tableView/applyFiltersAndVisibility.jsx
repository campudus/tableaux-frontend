import f from "lodash/fp";
import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { ShowArchived } from "../../archivedRows";
import DVWorkerCtl from "../../helpers/DisplayValueWorkerControls";
import { selectShowArchivedState } from "../../redux/reducers/tableView";
import { match, otherwise, when } from "match-iz";
import RowFilters, { filterStateful } from "../../RowFilters";

const withFiltersAndVisibility = Component => props => {
  const store = useSelector(x => x);
  const showArchived = selectShowArchivedState(store);
  const {
    tables,
    rows = [],
    columns = [],
    columnOrdering = [],
    filters = [],
    sorting = [],
    langtag,
    table
  } = props;
  const shouldLaunchDisplayValueWorker = DVWorkerCtl.shouldStartForTable(props);
  useEffect(() => {
    if (shouldLaunchDisplayValueWorker) {
      DVWorkerCtl.startForTable(props);
    }
  }, [shouldLaunchDisplayValueWorker]);

  const selectedCell = useSelector(state => state.selectedCell?.selectedCell);

  const [visibleRows, visibleColumnIDs] = useMemo(
    () => filterRows({ filters, sorting, table, langtag, store }),
    [
      arrayToKey(props.visibleRows),
      rows,
      showArchived,
      props.filters,
      props.sorting,
      f.isEmpty(props.allDisplayValues[props.table.id])
    ]
  );
  const columnsWithVisibility = columns.map((col, idx) => ({
    ...col,
    visible:
      idx === 0 ||
      col.id === selectedCell?.columnId ||
      visibleColumnIDs.has(col.id)
  }));
  const visibleColumnOrdering = columnOrdering
    .filter(({ idx }) => columnsWithVisibility[idx]?.visible)
    .map(({ id }) => id);

  const visibleRowIDs = useMemo(() => f.map("id", visibleRows), [visibleRows]);

  const hasRowJumpTarget = isNotNil(selectedCell.rowId);
  const canRenderTable = f.every(f.negate(f.isNil), [tables, rows, columns]);
  const showCellJumpOverlay =
    !props.finishedLoading &&
    hasRowJumpTarget &&
    !f.find(row => row.id === selectedCell.rowId);

  console.log({ filters });

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

const filterRows = ({ filters, sorting, table, langtag, store }) => {
  const showArchived = selectShowArchivedState(store);
  const nothingToFilter =
    f.isEmpty(sorting) &&
    f.isEmpty(filters) &&
    showArchived === ShowArchived.show;
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

  console.log("FILTER SETTING:", JSON.stringify(filterSetting, null, 2));

  const filterContext = RowFilters.buildContext(tableId, langtag, store);
  const filterRows = filterStateful(
    RowFilters.parse(filterContext)(filterSetting),
    new Set(visibleColumnIds)
  );

  return filterRows(rows);
};

export default withFiltersAndVisibility;
