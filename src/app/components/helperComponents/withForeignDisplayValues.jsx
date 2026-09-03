import { connect } from "react-redux";
import f from "lodash/fp";

import { ColumnKinds } from "../../constants/TableauxConstants";
import { doto, memoizeWith } from "../../helpers/functools";
import { applyLinkAttributeFormat } from "../../helpers/getDisplayValue";
import { retrieveTranslation } from "../../helpers/multiLanguage";
import * as t from "../taxonomy/taxonomy";

const isLinkColumn = f.propEq("kind", ColumnKinds.link);
const isConcatColumn = f.propEq("kind", ColumnKinds.concat);

const getDisplayValuesForTable = f.memoize(tableId =>
  f.propOr([], ["tableView", "displayValues", tableId])
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
  return f.map(retrieveTranslation(langtag), value).join(" ");
});

// Exported for the tests -- there is no component-render setup in this project
// to reach it through connect().
export const getLinkDisplayValues = ({
  value,
  column,
  table,
  row
}) => state => {
  const { toTable } = column;
  const tableDisplayValues = getDisplayValuesForTable(toTable)(state);
  const tableDisplayValuesMap = f.keyBy("id", tableDisplayValues);
  const linkTable = state.tables.data[toTable];
  const linkRowIds = f.map(f.prop("id"), value);

  if (t.isTaxonomyTable(linkTable)) {
    const taxonomyLinkRows = f.prop(["rows", toTable, "data"], state);
    const taxonomyTreeNodes = t.tableToTreeNodes({ rows: taxonomyLinkRows });
    const taxonomyTreeMap = f.keyBy("id", taxonomyTreeNodes);
    const taxonomyLinkNodes = f.map(id => taxonomyTreeMap[id], linkRowIds);
    const getPathFn = t.getPathToNode(taxonomyTreeNodes);
    const taxonomyDisplayValues = f.map(node => {
      const fullPath = f.concat(getPathFn(node), node);
      const displayValues = f.map(f.prop("displayValue"), fullPath);

      return displayValues;
    }, taxonomyLinkNodes);

    return {
      foreignDisplayValues: taxonomyDisplayValues
    };
  }

  // Preferred source: this cell's own display value, which already holds the
  // composed labels. `table`/`row` are absent when called from
  // getConcatDisplayValues -- fall through to the shared lookup then.
  const linkDisplayValues =
    table && row
      ? doto(
          state,
          getDisplayValuesForTable(table.id),
          getRow(row.id),
          f.prop(["values", getColumnIdx(table.id, column.id, state)])
        )
      : null;

  if (!f.isEmpty(linkDisplayValues)) {
    return { foreignDisplayValues: linkDisplayValues };
  }

  // Fallback: the shared identifiers, so the label is composed here. This is
  // also the path a link nested in a concat takes, which has no per-link slot
  // of its own to read from.
  const foreignDisplayValues = f.map(link => {
    const identifier = f.prop([link.id, "values", 0], tableDisplayValuesMap);

    return f.isEmpty(identifier)
      ? identifier
      : applyLinkAttributeFormat(column, link, identifier);
  }, value);

  return {
    foreignDisplayValues: f.isEmpty(foreignDisplayValues)
      ? null
      : foreignDisplayValues
  };
};

export const getConcatDisplayValues = (
  { value, column: { concats }, table, row },
  langtag
) => state => {
  const tableId = table.id;
  const tableDisplayValues = doto(
    state,
    getDisplayValuesForTable(tableId),
    getRow(row.id),
    f.prop("values")
  );
  if (f.isEmpty(tableDisplayValues)) {
    return { foreignDisplayValues: null };
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

const mapStateToProps = (state, props) => {
  const { cell, langtag } = props;
  if (f.any(f.isEmpty, f.props(["column", "table", "row"], cell))) {
    return {};
  }

  return isConcatColumn(cell.column)
    ? getConcatDisplayValues(cell, langtag)(state)
    : isLinkColumn(cell.column)
    ? getLinkDisplayValues(cell, langtag)(state)
    : { foreignDisplayValues: cell.displayValue };
};

// HOC ({ column, tableId }) -> (Component) -> Component
//
// connect() has to be applied once, at composition time: doing it inside render
// hands React a new component type every render, unmounting the whole subtree
// and discarding any state below it.
export const withForeignDisplayValues = Component =>
  connect(mapStateToProps)(Component);
