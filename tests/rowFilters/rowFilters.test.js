import data from "./testData/testData.json";
import f from "lodash/fp";
import getFilteredRows from "../../src/app/components/table/RowFilters";
import testData from "./testData/index.js";
import sparseRows from "./testData/sparseRows.json";
import { FilterModes } from "../../src/app/constants/TableauxConstants";
const { rowsWithIndex, table, langtag, columns, rows } = data;

const rowIndices = f.map("id", rows);

const filterRows = filters => {
  const { visibleRows } = getFilteredRows(
    table,
    rowsWithIndex,
    columns,
    langtag,
    filters
  );
  return f.map(rowIndex => rowIndices[rowIndex], visibleRows);
};

/*eslint-disable lodash-fp/no-unused-result*/
describe("Filter:", () => {
  f.compose(
    f.each(arr => {
      const [description, values] = arr;
      if (!f.includes("Sort", description)) {
        const { visibleRows, rowsFilter } = values;
        test(description, () => {
          expect(filterRows(rowsFilter)).toEqual(visibleRows);
        });
      }
    }),
    f.toPairs
  )(testData);
});
describe("Sorting:", () => {
  f.compose(
    f.each(arr => {
      const [description, values] = arr;
      if (f.includes("Sort", description)) {
        const { visibleRows, rowsFilter } = values;
        test(description, () => {
          expect(filterRows(rowsFilter)).toEqual(visibleRows);
        });
      }
    }),
    f.toPairs
  )(testData);
});

describe("empty filters", () => {
  it.each`
    colId | check
    ${1}  | ${"attachment"}
    ${2}  | ${"boolean"}
    ${3}  | ${"date"}
    ${4}  | ${"datetime"}
    ${5}  | ${"integer"}
    ${6}  | ${"link"}
    ${7}  | ${"numeric"}
    ${8}  | ${"richtext"}
    ${9}  | ${"shorttext"}
    ${10} | ${"text"}
    ${11} | ${"multilang attachment"}
    ${12} | ${"multilang boolean"}
    ${13} | ${"multilang currency"}
    ${14} | ${"multilang date"}
    ${15} | ${"multilang datetime"}
    ${16} | ${"multilang integer"}
    ${17} | ${"multilang link"}
    ${18} | ${"multilang numeric"}
    ${19} | ${"multilang richtext"}
    ${20} | ${"multilang shortext"}
    ${21} | ${"multilang text"}
  `("Check for empty column at colId $colId, type $check", ({ colId }) => {
    const filterSetting = {
      filters: [
        {
          mode: FilterModes.IS_EMPTY,
          columnId: colId,
          columnKind: sparseRows.columns[colId].kind,
          value: ""
        }
      ]
    };

    const filterResult = getFilteredRows(
      sparseRows.table,
      sparseRows.rows,
      sparseRows.columns,
      "de-DE",
      filterSetting
    ).visibleRows;
    // The test data consists of a table with 21 columns and 21 rows. All cells
    // are filled, except the diagonal (rowId = i, columnId = i); diagonal cells
    // are set to empty so we can easily test all valid column types.
    expect(filterResult.map(idx => sparseRows.rows[idx].id)).toEqual([colId]);
  });
});
