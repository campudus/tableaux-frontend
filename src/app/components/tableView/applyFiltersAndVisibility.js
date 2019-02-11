import React from "react";
import f from "lodash/fp";
import memoize from "memoize-one";
import { extractAnnotations } from "../../helpers/annotationHelper";
import { combineDisplayValuesWithLinks } from "../../helpers/linkHelper";

const mapIndexed = f.map.convert({ cap: false });

export default function(ComposedComponent) {
  return class ReduxContainer extends React.Component {
    applyColumnVisibility = (colsWithMatches = []) => {
      const { columns, visibleColumns } = this.props;
      const applyVisibility = (columns, visibleArray) =>
        f.map(column => {
          const { id } = column;
          if (!f.includes(id, visibleArray)) {
            return { ...column, visible: false };
          }
          return { ...column, visible: true };
        }, columns);
      if (!f.isEmpty(colsWithMatches)) {
        return applyVisibility(columns, colsWithMatches);
      }
      return applyVisibility(columns, visibleColumns);
    };

    prepareRows = memoize((tableId, rows, columns, allDisplayValues) => {
      const displayValues = combineDisplayValuesWithLinks(
        allDisplayValues,
        columns,
        tableId
      );
      return mapIndexed((row, rowIndex) => {
        const { values, annotations, id } = row;
        const rowDisplayValues = f.get([rowIndex], displayValues);
        const extractedAnnotations = f.map(extractAnnotations, annotations);
        const updatedValues = mapIndexed((cell, cellIndex) => {
          const { multilanguage, id, kind } = columns[cellIndex];
          return {
            value: cell,
            kind: kind,
            displayValue: f.get(["values", cellIndex], rowDisplayValues),
            annotations: f.get([cellIndex], extractedAnnotations),
            isMultilanguage: multilanguage,
            colId: id
          };
        }, values);
        return { id, values: updatedValues };
      }, rows);
    });

    applyFilters = (visibleRows, preparedRows) =>
      f.map(rowIndex => preparedRows[rowIndex], visibleRows);

    render() {
      const {
        tables,
        visibleRows,
        rows,
        columns,
        allDisplayValues,
        actions,
        startedGeneratingDisplayValues,
        table
      } = this.props;
      if (
        f.every(f.negate(f.isEmpty), [rows, columns]) &&
        f.isEmpty(allDisplayValues[table.id]) &&
        !startedGeneratingDisplayValues
      ) {
        const { generateDisplayValues } = actions;
        generateDisplayValues(rows, columns, table.id);
      }
      const canRenderTable = f.every(f.negate(f.isEmpty), [
        tables,
        rows,
        columns
      ]);
      if (canRenderTable) {
        const preparedRows = this.prepareRows(
          table.id,
          rows,
          columns,
          allDisplayValues
        );
        const filteredRows = this.applyFilters(visibleRows, preparedRows);
        const columnsWithVisibility = this.applyColumnVisibility();
        return (
          <ComposedComponent
            {...{
              ...this.props,
              columns: columnsWithVisibility,
              visibleColumns:f.filter("visible",columnsWithVisibility),
              rows: filteredRows,
              canRenderTable,
              preparedRows
            }}
          />
        );
      }
      return <ComposedComponent {...{ ...this.props, canRenderTable }} />;
    }
  };
}
