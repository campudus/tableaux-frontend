import React from "react";
import { compose, withPropsOnChange } from "recompose";
import getFilteredRows, { completeRowInformation } from "../table/RowFilters";
import f from "lodash/fp";

const applyFiltersAndVisibility = Component =>
  React.memo(props => {
    const {
      tables, // all tables
      rows, // all rows with cell values
      columns, // all columns without visibility information
      allDisplayValues,
      actions,
      startedGeneratingDisplayValues,
      table,
      langtag,
      finishedLoading,
      tableView: { selectedCell },
      visibleColumns,
      colsWithMatches
    } = props;

    const applyColumnVisibility = React.useCallback(() => {
      const applyVisibility = visibleColumnIds => {
        const isColumnVisible = ({ id }) =>
          id === 0 || f.includes(id, visibleColumnIds);
        const setColumnVisibility = column =>
          f.assoc("visible", isColumnVisible(column), column);

        return f.map(setColumnVisibility, columns);
      };

      return applyVisibility(
        f.isEmpty(colsWithMatches) ? visibleColumns : colsWithMatches
      );
    });

    // Start displayValue worker if neccessary
    if (
      !f.isEmpty(columns) &&
      f.isNil(allDisplayValues[table.id]) &&
      !startedGeneratingDisplayValues &&
      finishedLoading
    ) {
      const { generateDisplayValues } = actions;
      generateDisplayValues(rows, columns, table.id, langtag);
    }

    const canRenderTable = f.every(f.negate(f.isNil), [tables, rows, columns]);

    const hasJumpTarget = !f.every(f.isNil, [
      selectedCell.columnId,
      selectedCell.rowId
    ]);
    const jumpTargetIsIn = f.any(f.propEq("id", selectedCell.rowId)); // Don't calculate immediately for performance

    const showCellJumpOverlay =
      !finishedLoading && hasJumpTarget && !jumpTargetIsIn(rows);

    if (canRenderTable) {
      const { visibleRows } = props;
      const columnsWithVisibility = applyColumnVisibility();
      const columnRenderKey = f.flow(
        f.filter("visible"),
        f.map("id"),
        f.join(";")
      )(columnsWithVisibility);
      const orderedFilteredRows = f.map(
        rowIndex => rows[rowIndex],
        visibleRows
      );

      return (
        <Component
          {...{
            ...props,
            columns: columnsWithVisibility,
            visibleColumns: columnRenderKey,
            orderedFilteredRows,
            visibleRows,
            canRenderTable,
            showCellJumpOverlay
          }}
        />
      );
    } else {
      return (
        <Component {...{ ...props, canRenderTable, showCellJumpOverlay }} />
      );
    }
  });

const tableOrFiltersChanged = (props, nextProps) => {
  if (!props || !nextProps) {
    return false;
  }
  return (
    f.size(props.rows) !== f.size(nextProps.rows) || // rows got initialized
    (f.isEmpty(props.displayValues) && !f.isEmpty(nextProps.displayValues)) || // displayValues got initialized
    !f.isEqual(props.sorting, nextProps.sorting) ||
    !f.isEqual(props.filters, nextProps.filters)
  );
};

const filterRows = props => {
  const {
    filters,
    sorting,
    rows,
    table,
    langtag,
    columns,
    allDisplayValues,
    actions: { setColumnsVisible }
  } = props;
  const nothingToFilter = f.isEmpty(sorting) && f.isEmpty(filters);
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
    filters: f.reject(isFilterEmpty, filters)
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

export default compose(
  withPropsOnChange(tableOrFiltersChanged, filterRows),
  applyFiltersAndVisibility
);
