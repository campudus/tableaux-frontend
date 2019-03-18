import { connect } from "react-redux";
import React from "react";
import f from "lodash/fp";

import { ColumnKinds } from "../../constants/TableauxConstants";
import { doto, memoizeWith } from "../../helpers/functools";
import { retrieveTranslation } from "../../helpers/multiLanguage";

const isLinkColumn = f.propEq("kind", ColumnKinds.link);
const isConcatColumn = f.propEq("kind", ColumnKinds.concat);

const getTable = f.memoize(tableId =>
  f.prop(["tableView", "displayValues", tableId])
);

const getRow = rowId => f.find(f.propEq("id", rowId));

const tableColumnKey = (tableId, columnId) => `${tableId}-${columnId}`;
const getColumnIdx = memoizeWith(tableColumnKey, (tableId, columnId, state) => {
  return doto(
    state,
    f.prop(["columns", tableId, "data"]),
    f.findIndex(f.propEq("id", columnId))
  );
});

const flattenAndTranslate = f.curryN(2, (langtag, value = []) => {
  return value.map(retrieveTranslation(langtag)).join(" ");
});

const getLinkDisplayValues = ({ value, column: { toTable } }) => state => {
  const tableDisplayValues = getTable(toTable)(state);

  const foreignDisplayValues = f.isEmpty(tableDisplayValues)
    ? null
    : f.map(
        ({ id }) => doto(tableDisplayValues, getRow(id), f.prop(["values", 0])),
        value
      );

  return { foreignDisplayValues };
};

const getConcatDisplayValues = (
  { value, column: { concats }, table, row },
  langtag
) => state => {
  const tableId = table.id;
  const tableDisplayValues = doto(
    state,
    getTable(tableId),
    getRow(row.id),
    f.prop("values")
  );
  if (f.isEmpty(tableDisplayValues)) {
    return { foreignDisplayValuen: null };
  }
  const partialValues = concats
    .map((column, idx) => {
      if (isLinkColumn(column)) {
        return doto(
          state,
          getLinkDisplayValues({ value: f.nth(idx, value), column }),
          f.propOr([], "foreignDisplayValues"),
          flattenAndTranslate(langtag)
        );
      } else {
        const columnIdx = getColumnIdx(tableId, column.id, state);
        const displayValue = f.nth(columnIdx, tableDisplayValues);
        return f.isArray(displayValue)
          ? flattenAndTranslate(langtag, displayValue)
          : retrieveTranslation(langtag, displayValue);
      }
    })
    .filter(f.identity);
  return { foreignDisplayValues: partialValues.join(" ") };
};

// HOC ({ column, tableId }) -> (Component) -> Component
export const withForeignDisplayValues = Component => props => {
  const { cell, langtag } = props;
  if (f.any(f.isEmpty, f.props(["column", "table", "row"], cell))) {
    return <Component {...props} />;
  }

  const mapStateToProps = isConcatColumn(cell.column)
    ? getConcatDisplayValues(cell, langtag)
    : isLinkColumn(cell.column)
    ? getLinkDisplayValues(cell)
    : () => ({ foreignDisplayValues: cell.displayValue });
  const ConnectedComponent = connect(mapStateToProps)(Component);
  return <ConnectedComponent {...props} />;
};
