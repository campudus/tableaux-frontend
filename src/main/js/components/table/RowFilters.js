import FilteredSubcollection from "ampersand-filtered-subcollection";
import {ColumnKinds, SortValues, FilterModes} from "../../constants/TableauxConstants";
import RowConcatHelper from "../../helpers/RowConcatHelper";
import searchFunctions from "../../helpers/searchFunctions";
import * as f from "lodash/fp";
import * as _ from "lodash";
import {either} from "../../helpers/monads";

const getFilteredRows = (currentTable, langtag, rowsFilter) => {
  console.log("getFilteredRows:", rowsFilter);
  if (!areFilterSettingsValid(rowsFilter)) {
    return (f.isInteger(rowsFilter.sortColumnId))                      // is a sorting mode set?
      ? getRowsFilteredByColumnValues(currentTable, langtag, rowsFilter)
      : currentTable.rows;
  }

  const valueFilters = [FilterModes.CONTAINS, FilterModes.STARTS_WITH];
  const filterFunction = _.cond([
    [f.equals(FilterModes.ID_ONLY), f.always(getRowsFilteredById)],
    [f.equals(FilterModes.UNTRANSLATED), f.always(getRowsFilteredByTranslationStatus)],
    [f.equals(FilterModes.FINAL), f.always(getRowsFilteredByFinalFlag)],
    [mode => f.contains(mode, valueFilters), f.always(getRowsFilteredByColumnValues)]
  ])(rowsFilter.filterMode);
  return filterFunction(currentTable, langtag, rowsFilter);
};

export const areFilterSettingsValid = settings => {
  const {filterColumnId, filterValue, filterMode} = settings;
  return (f.isNumber(filterColumnId) && filterColumnId >= 0 && filterValue) // row filter
    || (filterMode === FilterModes.ID_ONLY && f.isNumber(filterValue))
    || (f.contains(filterMode, [FilterModes.UNTRANSLATED, FilterModes.FINAL]));
};

const getRowsFilteredByFinalFlag = (table, langtag, filterSettings) => {
  console.log("Filtered by final flag");
  const closures = mkClosures(table, langtag, filterSettings);
  return new FilteredSubcollection(table.rows, {
    filter: f.matchesProperty("final", filterSettings.filterValue),
    comparator: closures.comparator
  });
};

const getRowsFilteredById = (table, langtag, rowsFilter) => {
  console.log("Filtered by row id");
  const reqId = rowsFilter.filterValue;
  return new FilteredSubcollection(table.rows, {
    where: {id: reqId}
  });
};

const getRowsFilteredByTranslationStatus = (table, langtag, rowsFilter) => {
  console.log("Filtered by translation status");
  const closures = mkClosures(table, langtag, rowsFilter);
  const untranslated = rowsFilter.filterValue;
  const needsTranslation = f.compose(
    f.contains(langtag),
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
  return new FilteredSubcollection(table.rows, {
    filter: (untranslated) ? hasUntranslatedCells : row => !hasUntranslatedCells(row),
    comparator: closures.comparator
  });
};

const getRowsFilteredByColumnValues = (currentTable, langtag, rowsFilter) => {
  console.log("Filtered by column value");
  const {filterColumnId, filterValue, filterMode, sortColumnId} = rowsFilter;
  const closures = mkClosures(currentTable, langtag, rowsFilter);
  const filterColumnIndex = closures.getColumnIndex(filterColumnId);
  const allRows = currentTable.rows;
  const toFilterValue = closures.cleanString(filterValue);
  const getSortableCellValue = closures.getSortableCellValue;

  if (_.isEmpty(toFilterValue) && typeof sortColumnId === "undefined") {
    return allRows;
  }

  return new FilteredSubcollection(allRows, {
    filter: (row) => {
      if (filterColumnIndex <= -1 || (_.isEmpty(filterValue))) {
        // no or invalid column found OR no filter value
        return true;
      }

      const firstCell = row.cells.at(0);
      const firstCellValue = getSortableCellValue(firstCell);

      // Always return true for rows with empty first value.
      // This should allow to add new rows while filtered.
      // _.isEmpty(123) returns TRUE, so we check for number (int & float)
      if (_.isEmpty(firstCellValue) && !_.isNumber(firstCellValue)) {
        return true;
      }

      const targetCell = row.cells.at(filterColumnIndex);
      const searchFunction = searchFunctions[filterMode];
      const filterableCellKinds = [
        ColumnKinds.concat,
        ColumnKinds.shorttext,
        ColumnKinds.richtext,
        ColumnKinds.text,
        ColumnKinds.numeric,
        ColumnKinds.link
      ];

      if (f.contains(targetCell.kind, filterableCellKinds)) {
        return searchFunction(toFilterValue, getSortableCellValue(targetCell));
      } else {
        // column type not support for filtering
        return false;
      }
    },

    comparator: closures.comparator
  });
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
    const str = cell.rowConcatString(langtag);
    return (str === RowConcatHelper.NOVALUE) ? "" : cleanString(str);
  };
  const joinLinkStrings = f.compose(
    f.join(":"),
    f.map(f.defaultTo("")),
    f.map(f.trim),
    f.map(f.prop([langtag])),
    f.prop("linkStringLanguages")
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
    comparator: comparator
  };
};

export default getFilteredRows;
