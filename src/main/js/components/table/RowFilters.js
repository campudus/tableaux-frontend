import FilteredSubcollection from "ampersand-filtered-subcollection";
import {ColumnKinds, FilterModes, SortValues} from "../../constants/TableauxConstants";
import searchFunctions from "../../helpers/searchFunctions";
import * as f from "lodash/fp";
import * as _ from "lodash";
import {either, fspy} from "../../helpers/functools";

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

const FlagSearches = [FilterModes.CHECK_ME, FilterModes.IMPORTANT, FilterModes.POSTPONE];

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
    [({mode}) => f.contains(mode, FlagSearches), ({mode, value}) => mkFlagFilter(mode, value)],
    [({mode}) => f.contains(mode, valueFilters), mkColumnValueFilter(closures)],
    [f.stubTrue, f.stubTrue]
  ])(settings);
};

const mkFinalFilter = closures => ({value}) => {
  return f.matchesProperty("final", value);
};

const mkIDFilter = closures => ({value}) => {
  console.log("ID filter");
  return f.compose(
    (id) => f.contains(id, value),
    f.get("id")
  );
};

const mkOthersTranslationStatusFilter = closures => ({value}) => {
  const needsTranslation = f.compose(
    f.complement(f.isEmpty),
    fspy("langtags"),
    f.get(["annotations", "translationNeeded", "langtags"]),
    fspy("cell")
  );
  const hasUntranslatedCells = f.compose(
    f.any(needsTranslation),
    fspy("cells"),
    f.get(["cells", "models"]),
    fspy("row")
  );
  return (value === true) ? hasUntranslatedCells : f.complement(hasUntranslatedCells);
};

const mkTranslationStatusFilter = closures => ({value}) => {
  const needsTranslation = f.compose(
    f.contains(closures.langtag),
    f.get(["annotations", "translationNeeded", "langtags"]),
  );
  const hasUntranslatedCells = f.compose(
    f.any(needsTranslation),
    f.get(["cells", "models"])
  );
  return (value === true) ? hasUntranslatedCells : f.complement(hasUntranslatedCells);
};

const mkFlagFilter = (mode, value) => {
  const flag = {
    [FilterModes.IMPORTANT]: "important",
    [FilterModes.POSTPONE]: "postpone",
    [FilterModes.CHECK_ME]: "check-me"
  }[mode];
  const isAsRequired = (value)
    ? f.any((v) => v)
    : f.every((v) => !v);
  return f.compose(
    isAsRequired,
    f.map(f.get(["annotations", flag])),
    f.get(["cells", "models"])
  );
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
  const isOfKind = (kind) => f.matchesProperty("kind", kind);

  const getSortableCellValue = (cell) => {
    const getField = (field) => (cell) => (cell.isMultiLanguage)
      ? f.get([field, langtag], cell)
      : f.get([field, cell]);
    const rawValue = f.cond([
      [isOfKind(ColumnKinds.boolean), getField("value")],
      [f.stubTrue, f.get(["displayValue", langtag])]
    ])(cell);
    return f.cond([
      [isOfKind(ColumnKinds.numeric), f.always(f.toNumber(rawValue))],
      [isOfKind(ColumnKinds.boolean), f.always(!!rawValue)],
      [f.stubTrue, f.always(f.toLower(rawValue) || "")]
    ])(cell);
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
      return (idOf(a) === idOf(b))
        ? equal
        : idOf(a) - idOf(b);
    };
    const compareValues = (a, b) => (a > b) ? gt : lt;
    const isEmpty = (x) => !x && x !== 0 && x !== !!x;

    return (sortColumnIdx >= 0)
      ? f.cond([
        [(vals) => f.every(isEmpty, vals), f.always(equal)],
        [([A, dummy]) => isEmpty(A), f.always(bFirst)],
        [([dummy, B]) => isEmpty(B), f.always(aFirst)],
        [f.stubTrue, ([A, B]) => (f.eq(A, B)) ? compareRowIds(a, b) : compareValues(A, B)]
      ])(([a, b].map(getSortValue)))
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
