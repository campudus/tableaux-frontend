import React from "react";
import { compose, withPropsOnChange } from "recompose";
import getFilteredRows, { completeRowInformation } from "../table/RowFilters";
import f from "lodash/fp";

import { mapIndexed } from "../../helpers/functools";

const applyFiltersAndVisibility = function(ComposedComponent) {
  return class FilteredTableView extends React.Component {
    applyColumnVisibility = () => {
      const { columns, visibleColumns, colsWithMatches } = this.props;

      const applyVisibility = (columns, visibleArray) =>
        f.map(
          column =>
            f.assoc(
              "visible",
              f.includes(column.id, visibleArray) || column.id === 0,
              column
            ),
          columns
        );

      return applyVisibility(
        columns,
        f.isEmpty(colsWithMatches) ? visibleColumns : colsWithMatches
      );
    };

    updateColumnVisibility = (visibleRows, columnsWithVisibility) =>
      visibleRows.map(
        f.update(
          "cells",
          mapIndexed((cell, idx) =>
            f.assoc("column", columnsWithVisibility[idx], cell)
          )
        )
      );

    render() {
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
        columnOrdering,
        visibleColumns
      } = this.props;

      const sortedVisibleColumns = f.reduce(
        (acc, val) => {
          if (f.contains(val.id, visibleColumns)) {
            return f.concat(acc, [val.idx]);
          }
          return acc;
        },
        [],
        columnOrdering
      );
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

      const canRenderTable = f.every(f.negate(f.isNil), [
        tables,
        rows,
        columns
      ]);

      const showCellJumpOverlay = !finishedLoading;

      if (canRenderTable) {
        const columnsWithVisibility = this.applyColumnVisibility();
        return (
          <ComposedComponent
            {...{
              ...this.props,
              columns: columnsWithVisibility,
              visibleColumns: f.flow(
                f.filter("visible"),
                f.map("id"),
                f.join(";")
              )(columnsWithVisibility),
              rows: f.map(rowIndex => rows[rowIndex], this.props.visibleRows),
              visibleRows: this.props.visibleRows,
              canRenderTable,
              showCellJumpOverlay,
              visibleColumnOrdering: sortedVisibleColumns,
              columnOrdering: columnOrdering
            }}
          />
        );
      } else {
        return (
          <ComposedComponent
            {...{ ...this.props, canRenderTable, showCellJumpOverlay }}
          />
        );
      }
    }
  };
};

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
