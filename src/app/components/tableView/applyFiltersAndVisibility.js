import React from "react";
import { compose, withPropsOnChange } from "recompose";
import getFilteredRows from "../table/RowFilters";
import f from "lodash/fp";

import { mapIndexed } from "../../helpers/functools";

const applyFiltersAndVisibility = function(ComposedComponent) {
  return class FilteredTableView extends React.Component {
    applyColumnVisibility = () => {
      const { columns, visibleColumns, colsWithMatches } = this.props;
      const applyVisibility = (columns, visibleArray) =>
        f.map(
          column =>
            f.assoc("visible", f.includes(column.id, visibleArray), column),
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

    filterRows = (visibleIndices, rows) => visibleIndices.map(idx => rows[idx]);

    render() {
      const {
        tables, // all tables
        visibleRows, // array of visible rows' indices
        rows, // all rows with cell values
        columns, // all columns without visibility information
        allDisplayValues,
        actions,
        startedGeneratingDisplayValues,
        table,
        langtag
      } = this.props;

      // Start displayValue worker if neccessary
      if (
        f.every(f.negate(f.isEmpty), [rows, columns]) &&
        f.isEmpty(allDisplayValues[table.id]) &&
        !startedGeneratingDisplayValues
      ) {
        const { generateDisplayValues } = actions;
        generateDisplayValues(rows, columns, table.id, langtag);
      }

      const canRenderTable = f.every(f.negate(f.isEmpty), [
        tables,
        rows,
        columns
      ]);

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
              rows: f.map(rowIndex => rows[rowIndex], visibleRows),
              visibleRows,
              canRenderTable
            }}
          />
        );
      } else {
        return <ComposedComponent {...{ ...this.props, canRenderTable }} />;
      }
    }
  };
};

const tableOrFiltersChanged = (props, nextProps) => {
  const { tableId } = props;
  const displayValuesOf = f.prop(["allDisplayValues", tableId]);
  return (
    (f.isNil(props.rows) && !f.isNil(nextProps.rows)) || // rows got initialized
    (f.isEmpty(displayValuesOf(props)) &&
      !f.isEmpty(displayValuesOf(nextProps))) || // displayValues got initialized
    (!f.equals(props.sorting, nextProps.sorting) &&
      (!f.equals(props.filters, nextProps.filters) &&
        !f.isEmpty(displayValuesOf(nextProps)) &&
        !f.isEmpty(nextProps.rows)))
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
    actions:{setColumnsVisible}
  } = props;
  const nothingToFilter = f.isEmpty(sorting) && f.isEmpty(filters);
  if (f.isNil(rows) || f.isEmpty(allDisplayValues) || nothingToFilter) {
    return {
      visibleRows: f.range(0, f.size(rows)),
      filtering: !nothingToFilter
    };
  }
  const isFilterEmpty = filter =>
    f.isEmpty(filter.value) && !f.isString(filter.mode);
  const unfilteredRows = rows.map(f.identity);
  const rowsFilter = {
    sortColumnId: sorting.columnId,
    sortValue: sorting.value,
    filters: f.reject(isFilterEmpty, filters)
  };
  const {visibleRows,colsWithMatches } = getFilteredRows(
    table,
    unfilteredRows,
    columns,
    langtag,
    rowsFilter
  );
  if(!f.isEmpty(colsWithMatches)){
    setColumnsVisible(colsWithMatches);
  }


  return { visibleRows, filtering: false };
};

export default compose(
  withPropsOnChange(tableOrFiltersChanged, filterRows),
  applyFiltersAndVisibility
);
