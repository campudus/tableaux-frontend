import FilteredSubcollection from "ampersand-filtered-subcollection";
import {ColumnKinds, SortValues, FilterModes} from "../../constants/TableauxConstants";
import RowConcatHelper from "../../helpers/RowConcatHelper";
import searchFunctions from "../../helpers/searchFunctions";
import * as f from "lodash/fp";
import * as _ from "lodash";
import {either} from "../../helpers/monads";

const getFilteredRows = (currentTable, langtag, rowsFilter) => {
  console.log("getFilteredRows:", rowsFilter)
  if (!areFilterSettingsValid(rowsFilter)) {
    return (f.isInteger(rowsFilter.sortColumnId))                      // is a sorting mode set?
      ? getRowsFilteredByColumnValues(currentTable, langtag, rowsFilter)
      : currentTable.rows;
  }

  const valueFilters = [FilterModes.CONTAINS, FilterModes.STARTS_WITH];
  const filterFunction = _.cond([
    [f.equals(FilterModes.ID_ONLY), f.always(getRowsFilteredById)],
    [f.equals(FilterModes.UNTRANSLATED), f.always(getRowsFilteredByTranslationStatus)],
    [mode => f.contains(mode, valueFilters), f.always(getRowsFilteredByColumnValues)]
  ])(rowsFilter.filterMode);
  return filterFunction(currentTable, langtag, rowsFilter);
};

export const areFilterSettingsValid = settings => {
  const {filterColumnId, filterValue, filterMode} = settings;
  return (f.isNumber(filterColumnId) && filterColumnId >= 0 && filterValue) // row filter
    || (filterMode === FilterModes.ID_ONLY && f.isNumber(filterValue))
    || (filterMode === FilterModes.UNTRANSLATED);
};

const getRowsFilteredById = (table, langtag, rowsFilter) => {
  console.log("Filtered by row id")
  const reqId = rowsFilter.filterValue;
  return new FilteredSubcollection(table.rows, {
    where: {id: reqId}
  });
};

const getRowsFilteredByTranslationStatus = (table, langtag, rowsFilter) => {
  console.log("Filtered by translation status")
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
    comparator: closures.comparator,
    watched: ["annotations"]
  });
};

const getRowsFilteredByColumnValues = (currentTable, langtag, rowsFilter) => {
  console.log("Filtered by column value")
  const {filterColumnId, filterValue, filterMode, sortColumnId} = rowsFilter;
  const closures = mkClosures(currentTable, langtag, rowsFilter);
  const filterColumnIndex = closures.getColumnIndex(filterColumnId);
  const allRows = currentTable.rows;
  const toFilterValue = filterValue.toLowerCase().trim();

  const getSortableCellValue = function (cell) {
    let sortableValue;

    if (cell.isLink) {
      const linkValues = _.map(cell.linkStringLanguages, (linkElement) => {
        return linkElement[langtag] ? linkElement[langtag] : "";
      });

      sortableValue = _.join(linkValues, ":");
    } else if (cell.kind === ColumnKinds.concat) {
      // not really nice I think the Cell should replace
      // an empty concat value with "- NO VALUE -" and not
      // the model itself!
      const temp = cell.rowConcatString(langtag);
      sortableValue = temp === RowConcatHelper.NOVALUE ? "" : temp;
    } else if (cell.isMultiLanguage) {
      sortableValue = cell.value[langtag];
    } else {
      sortableValue = cell.value;
    }

    if (sortableValue) {
      if (cell.kind === ColumnKinds.numeric) {
        sortableValue = _.toNumber(sortableValue);
      } else if (cell.kind === ColumnKinds.boolean) {
        sortableValue = !!sortableValue;
      } else {
        sortableValue = sortableValue.toString().trim().toLowerCase();
      }
    } else {
      if (cell.kind === ColumnKinds.boolean) {
        sortableValue = false;
      } else {
        sortableValue = "";
      }
    }

    return sortableValue;
  };

  if (_.isEmpty(toFilterValue) && typeof sortColumnId === "undefined") {
    return allRows;
  }

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
      if (_.isEmpty(firstCellValue) && !_.isFinite(firstCellValue)) {
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
        ColumnKinds.link,
        ColumnKinds.concat
      ];

      if (f.contains(targetCell.kind, filterableCellKinds)) {
        return searchFunction(toFilterValue, getSortableCellValue(targetCell));
      } else {
        // column type not support for filtering
        return false;
      }
    },

    comparator: (rowOne, rowTwo) => {
      // swap gt and lt to support ASC and DESC
      // gt = in case rowOne > rowTwo
      // lt = in case rowOne < rowTwo
      const gt = sortValue === SortValues.ASC ? +1 : -1;
      const lt = sortValue === SortValues.ASC ? -1 : +1;

      const compareRowIds = () => {
        return rowOne.id === rowTwo.id ? 0 : (rowOne.id > rowTwo.id ? gt : lt);
      };

      if (sortColumnIndex <= -1) {
        if (typeof rowTwo === "undefined") {
          // strange special case if row was added
          return rowOne.id;
        }

        // Default sort by row id
        return compareRowIds();
      } else {
        const cellValueOne = rowOne && rowOne.cells ? getSortableCellValue(rowOne.cells.at(sortColumnIndex)) : null;
        const cellValueTwo = rowTwo && rowTwo.cells ? getSortableCellValue(rowTwo.cells.at(sortColumnIndex)) : null;

        const isEmptyOne = cellValueOne === null || (typeof cellValueOne === "string" && _.isEmpty(cellValueOne));
        const isEmptyTwo = cellValueTwo === null || (typeof cellValueTwo === "string" && _.isEmpty(cellValueTwo));

        if (isEmptyOne && isEmptyTwo) {
          return 0;
        } else if (isEmptyOne) {
          // ensure than in both sorting cases null/emptys are last!
          return sortValue === SortValues.ASC ? gt : lt;
        } else if (isEmptyTwo) {
          // ensure than in both sorting cases null/emptys are last!
          return sortValue === SortValues.ASC ? lt : gt;
        } else {
          // first compare values and if equal than sort by row id
          return _.eq(cellValueOne, cellValueTwo) ? compareRowIds() : (_.gt(cellValueOne, cellValueTwo) ? gt : lt);
        }
      }
    }
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
