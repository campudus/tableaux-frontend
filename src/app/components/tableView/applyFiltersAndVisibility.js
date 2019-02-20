import React from "react";

import f from "lodash/fp";

import { mapIndexed } from "../../helpers/functools";

export default function(ComposedComponent) {
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
        generateDisplayValues(rows, columns, table.id,langtag);
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
              rows: f.map(rowIndex => rows[rowIndex] ,visibleRows),
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
}
