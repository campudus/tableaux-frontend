import FilteredSubcollection from "ampersand-filtered-subcollection";
import {ColumnKinds, FilterModes, SortValues} from "../../constants/TableauxConstants";
import RowConcatHelper from "../../helpers/RowConcatHelper";
import searchFunctions from "../../helpers/searchFunctions";
import * as f from "lodash/fp";
import * as _ from "lodash";
import {either} from "../../helpers/monads";

export const FilterableCellKinds = [
  ColumnKinds.concat,
  ColumnKinds.shorttext,
  ColumnKinds.richtext,
  ColumnKinds.text,
  ColumnKinds.numeric,
  ColumnKinds.link
];

export const SortableCellKinds = [
  ColumnKinds.text,
  ColumnKinds.shorttext,
  ColumnKinds.richtext,
  ColumnKinds.numeric,
  ColumnKinds.concat,
  ColumnKinds.link,
  ColumnKinds.boolean,
  ColumnKinds.date,
  ColumnKinds.datetime
];

const getFilteredRows = (currentTable, langtag, filterSettings) => {
  const closures = mkClosures(currentTable, langtag, filterSettings);
  const allFilters = f.map(mkFilterFn(closures), filterSettings.filters || []);
  const combinedFilter = f.compose(
    f.every(f.identity),
    f.juxt(allFilters)
  );
  return new FilteredSubcollection(currentTable.rows, {
    filter: combinedFilter,
    comparator: closures.comparator
  });
};

const mkFilterFn = closures => (settings) => {
  const valueFilters = [FilterModes.CONTAINS, FilterModes.STARTS_WITH];
  return f.cond([
    [f.matchesProperty("mode", FilterModes.ID_ONLY), mkIDFilter(closures)],
    [f.matchesProperty("mode", FilterModes.UNTRANSLATED), mkTranslationStatusFilter(closures)],
    [f.matchesProperty("mode", FilterModes.ANY_UNTRANSLATED), mkOthersTranslationStatusFilter(closures)],
    [f.matchesProperty("mode", FilterModes.FINAL), mkFinalFilter(closures)],
    [({mode}) => f.contains(mode, valueFilters), mkColumnValueFilter(closures)],
    [f.stubTrue, f.stubTrue]
  ])(settings);
};

const mkFinalFilter = closures => ({value}) => {
  return f.matchesProperty("final", value);
};

const mkIDFilter = closures => ({value}) => {
  console.log("ID filter");
  return f.matchesProperty("id", value);
};

const mkOthersTranslationStatusFilter = closures => ({value}) => {
  const needsTranslation = f.compose(
    f.complement(f.isEmpty),
    f.prop("langtags"),
    f.first,
    f.filter(f.matchesProperty("value", "needs_translation")),
    f.filter(f.matchesProperty("type", "flag"))
  );
  const hasUntranslatedCells = f.compose(
    f.any(f.identity),
    f.map(needsTranslation),
    f.prop("annotations"),
  );
  return (value === true) ? hasUntranslatedCells : f.complement(hasUntranslatedCells);
};

const mkTranslationStatusFilter = closures => ({value}) => {
  const needsTranslation = f.compose(
    f.contains(closures.langtag),
    f.prop("langtags"),
    f.first,
    f.filter(f.matchesProperty("value", "needs_translation")),
    f.filter(f.matchesProperty("type", "flag")),
  );
  const hasUntranslatedCells = f.compose(
    f.any(f.identity),
    f.map(needsTranslation),
    f.prop("annotations"),
  );
  return (value === true) ? hasUntranslatedCells : f.complement(hasUntranslatedCells);
};

const mkColumnValueFilter = closures => ({value, mode, columnId}) => {
  const filterColumnIndex = closures.getColumnIndex(columnId);
  const toFilterValue = closures.cleanString(value);
  const getSortableCellValue = closures.getSortableCellValue;

  if (_.isEmpty(toFilterValue) && typeof sortColumnId === "undefined") {
    return f.stubTrue;
  }

  return (row) => {
    const firstCell = row.cells.at(0);
    const firstCellValue = getSortableCellValue(firstCell);

    // Always return true for rows with empty first value.
    // This should allow to add new rows while filtered.
    // _.isEmpty(123) returns TRUE, so we check for number (int & float)
    if (_.isEmpty(firstCellValue) && !_.isNumber(firstCellValue)) {
      return true;
    }

    const targetCell = row.cells.at(filterColumnIndex);
    const searchFunction = searchFunctions[mode];

    if (f.contains(targetCell.kind, FilterableCellKinds)) {
      return searchFunction(toFilterValue, getSortableCellValue(targetCell));
    } else {
      // column type not support for filtering
      return false;
    }
  };
};

// Generate settings-specific helper functions needed by all filters
const mkClosures = (table, langtag, rowsFilter) => {
  const {columns, rows} = table;
  const cleanString = f.compose(f.trim, f.toLower, f.toString);
  const getColumnIndex = id => f.findIndex(f.matchesProperty("id", id), columns.models);
  const {sortValue} = rowsFilter;

  const sortColumnIdx = getColumnIndex(rowsFilter.sortColumnId);
  const isOfKind = kind => f.matchesProperty("kind", kind);
  const getConcatString = cell => {
    const str = cell.displayValue[langtag];
    return (str === RowConcatHelper.NOVALUE) ? "" : cleanString(str);
  };
  const joinLinkStrings = f.compose(
    f.join(":"),
    f.map(f.defaultTo("")),
    f.map(f.trim),
    f.map(f.prop([langtag])),
    f.prop("displayValue")
  );
  const getSortableCellValue = cell => {
    const rawValue = f.cond([
      [f.prop("isLink"), joinLinkStrings],
      [isOfKind(ColumnKinds.concat), getConcatString],
      [f.prop("isMultiLanguage"), f.prop(["value", langtag])],
      [f.stubTrue, f.prop(["value"])]
    ])(cell);
    const fixedValue = f.cond([
      [isOfKind(ColumnKinds.number), f.always(f.toNumber(rawValue))],
      [isOfKind(ColumnKinds.boolean), f.always(!!rawValue)],
      [f.stubTrue, f.always(cleanString(rawValue))]
    ])(cell);
    return (fixedValue || cell.kind === ColumnKinds.boolean) ? fixedValue : "";
  };

  const comparator = (a, b) => {
    const dir = (sortValue === SortValues.ASC) ? +1 : -1;
    const [gt, lt] = [dir, -dir];
    const [aFirst, bFirst, equal] = [-1, +1, 0];
    const getSortValue = row => {
      return either(row)
        .map(r => r.cells.at(sortColumnIdx))
        .map(getSortableCellValue)
        .getOrElse(null);
    };
    const compareRowIds = (a, b) => {
      const idOf = f.prop("id");
      return f.eq(idOf(a), idOf(b)) ? equal : idOf(a) - idOf(b);
    };
    const compareValues = (a, b) => (f.gt(a, b)) ? gt : lt;

    return (sortColumnIdx >= 0)
      ? f.cond([
        [(vals) => f.every(f.identity, f.map(f.isEmpty, vals)), f.always(equal)],
        [([A, dummy]) => f.isEmpty(A), f.always(bFirst)],
        [([dummy, B]) => f.isEmpty(B), f.always(aFirst)],
        [f.stubTrue, ([A, B]) => (f.equals(A, B)) ? compareRowIds(a, b) : compareValues(A, B)]
      ])(f.map(getSortValue, [a, b]))
      : compareRowIds(a, b);
  };

  return {
    getColumnIndex: getColumnIndex,
    getSortableCellValue: getSortableCellValue,
    rows: rows,
    cleanString: cleanString,
    comparator: comparator,
    langtag
  };
};

export default getFilteredRows;
