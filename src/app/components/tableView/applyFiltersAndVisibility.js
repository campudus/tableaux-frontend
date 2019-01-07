import React from "react";
import f from "lodash/fp";
import memoize from "memoize-one";
import getFilteredRows from "../table/RowFilters";
import getDisplayValue from "../../helpers/getDisplayValue";
import {extractAnnotations} from "../../helpers/annotationHelper";

const mapIndexed = f.map.convert({cap: false});

export default function(ComposedComponent) {
  return class ReduxContainer extends React.Component {
    applyColumnVisibility = () => {
      const {columns, visibleColumns} = this.props;
      return f.map(column => {
        const {id} = column;
        if (!f.includes(id, visibleColumns)) {
          return {...column, visible: false};
        }
        return {...column, visible: true};
      }, columns);
    };

    prepareRowsForFilter = memoize((rows, columns, displayValues) =>
      mapIndexed((row, id) => {
        const {values,annotations} = row;
        const extractedAnnotations = f.map(extractAnnotations,annotations);
        const updatedValues = mapIndexed((cell, index) => {
          return {
            value: cell,
            kind: columns[index].kind,
            displayValue: displayValues[id][index],
            annotations: f.get([index], extractedAnnotations),
            isMultilanguage: f.get(["multilanguage"],columns)
          };
        }, values);
        return {...row, values: updatedValues};
      }, rows)
    );

    filterRows = (
      columns,
      table,
      tables,
      rows,
      filters,
      sorting,
      langtag,
      displayValues
    ) => {
      const isFilterEmpty = filter =>
        f.isEmpty(filter.value) && !f.isString(filter.mode);
      const rowsFilter = {
        sortColumnId: sorting.columnId,
        sortValue: sorting.value,
        filters: f.reject(isFilterEmpty, filters)
      };
      const preparedRows = this.prepareRowsForFilter(
        rows,
        columns,
        displayValues
      );
      console.log(preparedRows);
      return getFilteredRows(table, preparedRows, columns, langtag, rowsFilter);
    };

    render() {
      const {
        tables,
        rows,
        columns,
        displayValues,
        actions,
        startedGeneratingDisplayValues,
        filters,
        sorting,
        langtag,
        table
      } = this.props;
      if (
        f.every(f.negate(f.isEmpty), [rows, columns]) &&
        f.isEmpty(displayValues) &&
        !startedGeneratingDisplayValues
      ) {
        const {generateDisplayValues} = actions;
        generateDisplayValues(rows, columns);
      }

      const canRenderTable = f.every(f.negate(f.isEmpty), [
        tables,
        rows,
        columns,
        displayValues
      ]);

      const newProps = canRenderTable
        ? {
            ...this.props,
            columns: this.applyColumnVisibility(),
            rows: this.filterRows(
              columns,
              table,
              tables,
              rows,
              filters,
              sorting,
              langtag,
              displayValues
            ),
            canRenderTable
          }
        : {...this.props, canRenderTable};
      return <ComposedComponent {...newProps} />;
    }
  };
}
