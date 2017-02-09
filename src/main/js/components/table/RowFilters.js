import FilteredSubcollection from "ampersand-filtered-subcollection";
import {ColumnKinds, SortValues, FilterModes} from "../../constants/TableauxConstants";
import RowConcatHelper from "../../helpers/RowConcatHelper";
import searchFunctions from "../../helpers/searchFunctions";
import * as f from "lodash/fp";
import * as _ from "lodash";

const getFilteredRows = (currentTable, langtag, rowsFilter) => {
  const valueFilters = [FilterModes.CONTAINS, FilterModes.STARTS_WITH];
  const filterFunction = _.cond([
    [f.equals(FilterModes.ID_ONLY), f.always(getRowsFilteredById)],
    [mode => f.contains(mode, valueFilters), f.always(getRowsFilteredByColumnValues)]
  ])(rowsFilter.filterMode);
  return filterFunction(currentTable, langtag, rowsFilter);
};

const getRowsFilteredById = (table, langtag, rowsFilter) => {
  const reqId = rowsFilter.filterValue;
  return new FilteredSubcollection(table.rows, {
    where: {id: reqId}
  });
};

const getRowsFilteredByColumnValues = (currentTable, langtag, rowsFilter) => {
  const filterColumnId = rowsFilter.filterColumnId;
  const filterValue = rowsFilter.filterValue;
  const filterMode = rowsFilter.filterMode;
  const sortColumnId = rowsFilter.sortColumnId;
  const sortValue = rowsFilter.sortValue;

  const columnsOfTable = currentTable.columns;

  const filterColumnIndex = _.isFinite(filterColumnId)
    ? columnsOfTable.indexOf(columnsOfTable.get(filterColumnId))
    : -1;
  const sortColumnIndex = _.isFinite(sortColumnId) ? columnsOfTable.indexOf(columnsOfTable.get(sortColumnId)) : -1;

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

  if (_.isEmpty(toFilterValue) && typeof sortColumnId === 'undefined') {
    return allRows;
  }

  if (_.isEmpty(toFilterValue) && typeof sortColumnId === 'undefined') {
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

      if (targetCell.kind === ColumnKinds.shorttext
        || targetCell.kind === ColumnKinds.richtext
        || targetCell.kind === ColumnKinds.numeric
        || targetCell.kind === ColumnKinds.text
        || targetCell.kind === ColumnKinds.link
        || targetCell.kind === ColumnKinds.concat) {
        return searchFunction(toFilterValue, getSortableCellValue(targetCell))
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
        if (typeof rowTwo === 'undefined') {
          // strange special case if row was added
          return rowOne.id;
        }

        // Default sort by row id
        return compareRowIds();
      } else {
        const cellValueOne = rowOne && rowOne.cells ? getSortableCellValue(rowOne.cells.at(sortColumnIndex)) : null;
        const cellValueTwo = rowTwo && rowTwo.cells ? getSortableCellValue(rowTwo.cells.at(sortColumnIndex)) : null;

        const isEmptyOne = cellValueOne === null || (typeof cellValueOne === 'string' && _.isEmpty(cellValueOne));
        const isEmptyTwo = cellValueTwo === null || (typeof cellValueTwo === 'string' && _.isEmpty(cellValueTwo));

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
          return _.eq(cellValueOne, cellValueTwo) ? compareRowIds() : (_.gt(cellValueOne, cellValueTwo) ? gt : lt)
        }
      }
    }
  });
};

export default getFilteredRows;
