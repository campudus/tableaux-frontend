import React from "react";
import { compose, withPropsOnChange } from "recompose";
import getFilteredRows, { completeRowInformation } from "../table/RowFilters";
import store from "../../redux/store";
import f from "lodash/fp";
import { ColumnKinds } from "../../constants/TableauxConstants";
import * as t from "../../helpers/transduce";

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

      const sortedVisibleColumns = getSortedVisibleColumns(
        columnOrdering,
        visibleColumns,
        columns
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

      const getSelectedCell = () => {
        const {
          selectedCell: { selectedCell }
        } = store.getState();
        return selectedCell;
      };

      const hasJumpTarget = () => {
        const selectedCell = getSelectedCell();
        return f.every(f.negate(f.isNil), [
          selectedCell.columnId,
          selectedCell.rowId
        ]);
      };

      const jumpTargetIn = rows => {
        const selectedCell = getSelectedCell();
        return f.any(f.propEq("id", selectedCell.rowId), rows);
      };
      const showCellJumpOverlay =
        !finishedLoading && hasJumpTarget() && !jumpTargetIn(rows);

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