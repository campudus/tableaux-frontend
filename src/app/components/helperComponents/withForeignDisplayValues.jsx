import { connect } from "react-redux";
import f from "lodash/fp";

import { ColumnKinds } from "../../constants/TableauxConstants";
import { doto, memoizeWith } from "../../helpers/functools";
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

const getLinkDisplayValues = ({ value, column, table, row }) => state => {
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

  // Preferred source: this cell's own displayValue, which the worker/reducers
  // compute per edge and therefore carries the link column's formatPattern
  // applied with each edge's `attributes`. The per-target-row lookup below is
  // shared across edges and holds the target's plain identifier only.
  // `table`/`row` are absent when called from getConcatDisplayValues -- fall
  // through to that lookup then.
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

  const foreignDisplayValues = f.map(
    id => f.prop([id, "values", 0], tableDisplayValuesMap),
    linkRowIds
  );

  return {
    foreignDisplayValues: f.isEmpty(foreignDisplayValues)
      ? null
      : foreignDisplayValues
  };
};

const getConcatDisplayValues = (
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
// connect() is applied once, at composition time. Building it inside render
// instead would hand React a brand new component type on every render, which
// unmounts and remounts the whole subtree -- that discarded any state below,
// e.g. the open LinkAttributesPopover in the detail EntityView (and its
// unsaved draft) as soon as a mouse move re-rendered the row.
export const withForeignDisplayValues = Component =>
  connect(mapStateToProps)(Component);
