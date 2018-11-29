import AmpersandFilteredSubcollection from "ampersand-filtered-subcollection";
import {ColumnKinds, FilterModes, SortValues} from "../../constants/TableauxConstants";
import searchFunctions from "../../helpers/searchFunctions";
import f from "lodash/fp";
import {doto, either, withTryCatch} from "../../helpers/functools";

const FilteredSubcollection = AmpersandFilteredSubcollection.extend(
  {
    colsWithMatches: null
  }
);

export const FilterableCellKinds = [
  ColumnKinds.concat,
  ColumnKinds.shorttext,
  ColumnKinds.richtext,
  ColumnKinds.text,
  ColumnKinds.numeric,
  ColumnKinds.link,
  ColumnKinds.boolean
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

const FlagSearches = [FilterModes.CHECK_ME, FilterModes.IMPORTANT, FilterModes.POSTPONE, FilterModes.WITH_COMMENT];

const getFilteredRows = (currentTable, langtag, filterSettings) => {
  const closures = mkClosures(currentTable, langtag, filterSettings);
  const allFilters = f.flow( // eslint-disable-line lodash-fp/prefer-composition-grouping
    f.map(mkFilterFn(closures)),
    f.map(fn => withTryCatch(fn, f.always(false))) // to get errors, replace f.always(false) with eg. console.error
  )(filterSettings.filters || []);
  const combinedFilter = f.flow(
    f.juxt(allFilters),
    f.every(f.identity)
  );
  const coll = new FilteredSubcollection(currentTable.rows, {
    filter: combinedFilter,
    comparator: (f.isInteger(filterSettings.sortColumnId)) ? closures.comparator : null
  });
  coll.colsWithMatches = f.uniq(Array.from(closures.colsWithMatches.values()));
  return coll;
};

const mkFilterFn = (closures) => (settings) => {
  const valueFilters = [FilterModes.CONTAINS, FilterModes.STARTS_WITH];
  return f.cond([
    [f.matchesProperty("mode", FilterModes.ID_ONLY), mkIDFilter(closures)],
    [f.matchesProperty("mode", FilterModes.UNTRANSLATED), mkTranslationStatusFilter(closures)],
    [f.matchesProperty("mode", FilterModes.ANY_UNTRANSLATED), mkOthersTranslationStatusFilter(closures)],
    [f.matchesProperty("mode", FilterModes.FINAL), mkFinalFilter(closures)],
    [f.matchesProperty("mode", FilterModes.ROW_CONTAINS), mkAnywhereFilter(closures)],
    [f.matchesProperty("mode", FilterModes.TRANSLATOR_FILTER), mkTranslatorFilter(closures)],
    [({mode}) => f.contains(mode, FlagSearches), ({mode, value}) => mkFlagFilter(closures, mode, value)],
    [f.matchesProperty("columnKind", ColumnKinds.boolean), mkBoolFilter(closures)],
    [({mode}) => f.contains(mode, valueFilters), mkColumnValueFilter(closures)],
    [f.stubTrue, f.stubTrue]
  ])(settings);
};

const rememberColumnIds = (colSet) => f.tap(
  (cell) => colSet.add(cell.column.id)
);

const mkAnywhereFilter = (closures) => ({value}) => {
  return f.flow(
    f.get(["cells", "models"]),
    f.filter(f.overEvery([
      (cell) => f.contains(cell.kind, FilterableCellKinds),
      (cell) => searchFunctions[FilterModes.CONTAINS](value, closures.getSortableCellValue(cell))
      ])),
    f.map(rememberColumnIds(closures.colsWithMatches)),
    f.any(f.identity),
  );
};

const mkBoolFilter = (closures) => ({value, columnId}) => (row) => {
  const colIdx = f.findIndex(f.matchesProperty("id", columnId), row.columns.models);
  return doto(
    row.cells.at(colIdx),
    (cell) => (cell.isMultiLanguage)
      ? cell.value[closures.langtag]
      : cell.value,
    (boolVal) => !!boolVal === value,
  );
};

const mkTranslatorFilter = (closures) => () => (row) => {
  if (f.isEmpty(closures.colsWithMatches)) {
    row.columns
       .filter(f.get("isMultilanguage"))
       .forEach(rememberColumnIds(closures.colsWithMatches));
  }
  return f.flow(
    f.get(["cells", "models"]),
    f.map(["annotations", "translationNeeded", "langtags", closures.langtag]),
    f.any(f.identity)
  )(row);
};

const mkFinalFilter = closures => ({value}) => {
  return f.matchesProperty("final", value);
};

const mkIDFilter = closures => ({value}) => {
  return f.flow(
    f.get("id"),
    (id) => f.contains(id, value)
  );
};

const hasUntranslatedCells = (closures, needsTranslation) => f.flow(
  f.get(["cells", "models"]),
  f.filter(needsTranslation),
  f.map(rememberColumnIds(closures.colsWithMatches)),
  f.complement(f.isEmpty)
);

const mkOthersTranslationStatusFilter = (closures) => ({value}) => {
  const needsTranslation = f.flow(
    f.get(["annotations", "translationNeeded", "langtags"]),
    f.complement(f.isEmpty),
    (match) => (value) ? match : !match
  );

  const hasUntranslatedCellsFn = hasUntranslatedCells(closures, needsTranslation);
  return (value === true) ? hasUntranslatedCellsFn : f.complement(hasUntranslatedCellsFn);
};

const mkTranslationStatusFilter = (closures) => ({value}) => {
  const needsTranslation = f.flow(
    f.get(["annotations", "translationNeeded", "langtags"]),
    f.contains(closures.langtag),
    (match) => (value) ? match : !match
  );

  const hasUntranslatedCellsFn = hasUntranslatedCells(closures, needsTranslation);
  return (value === true) ? hasUntranslatedCellsFn : f.complement(hasUntranslatedCellsFn);
};

const mkFlagFilter = (closures, mode, value) => {
  const flag = f.get(mode, {
    [FilterModes.IMPORTANT]: "important",
    [FilterModes.POSTPONE]: "postpone",
    [FilterModes.CHECK_ME]: "check-me"
  });

  const findAnnotation = (flag)
    ? f.get(["annotations", flag]) // search for flag
    : f.flow( // else search for comment
      f.get("annotations"),
      f.keys,
      f.intersection(["info", "warning", "error"]),
      f.complement(f.isEmpty)
    );

  return f.flow(
    f.get(["cells", "models"]),
    f.filter(findAnnotation),
    f.map(rememberColumnIds(closures.colsWithMatches)),
    f.isEmpty,
    (misMatch) => (value) ? !misMatch : misMatch
  );
};

const mkColumnValueFilter = closures => ({value, mode, columnId}) => {
  const filterColumnIndex = closures.getColumnIndex(columnId);
  const toFilterValue = closures.cleanString(value);
  const getSortableCellValue = closures.getSortableCellValue;

  if (f.isEmpty(toFilterValue) && typeof sortColumnId === "undefined") {
    return f.stubTrue;
  }

  return (row) => {
    const firstCell = row.cells.at(0);
    const firstCellValue = getSortableCellValue(firstCell);

    // Always return true for rows with empty first value.
    // This should allow to add new rows while filtered.
    // f.isEmpty(123) returns TRUE, so we check for number (int & float)
    if (f.isEmpty(firstCellValue) && !f.isNumber(firstCellValue)) {
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
  const cleanString = f.flow(f.toString, f.toLower, f.trim);
  const getColumnIndex = id => f.findIndex(f.matchesProperty("id", id), columns.models);
  const {sortValue} = rowsFilter;

  const sortColumnIdx = getColumnIndex(rowsFilter.sortColumnId);
  const isOfKind = (kind) => f.matchesProperty("kind", kind);
  const joinStrings = f.flow(
    f.get("displayValue"),
    f.map(f.get(langtag)),
    f.join("::")
  );

  const getPlainValue = (cell) => (cell.isMultiLanguage)
    ? cell.value[langtag]
    : cell.value;

  const getSortableCellValue = (cell) => {
    const rawValue = f.cond([
      [isOfKind(ColumnKinds.boolean), getPlainValue],
      [isOfKind(ColumnKinds.link), joinStrings],
      [isOfKind(ColumnKinds.attachment), joinStrings],
      [isOfKind(ColumnKinds.date), getPlainValue],
      [isOfKind(ColumnKinds.datetime), getPlainValue],
      [f.stubTrue, f.get(["displayValue", langtag])]
    ])(cell);
    return f.cond([
      [isOfKind(ColumnKinds.numeric), f.always(f.toNumber(rawValue))],
      [isOfKind(ColumnKinds.boolean), f.always((rawValue) ? "a" : "b")],
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
    colsWithMatches: new Set(),
    cleanString: cleanString,
    comparator: comparator,
    langtag
  };
};

export default getFilteredRows;
