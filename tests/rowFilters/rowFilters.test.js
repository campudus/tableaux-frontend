import data from "./testData/testData.json";
import f from "lodash/fp";
import getFilteredRows from "../../src/app/components/table/RowFilters";
import testData from "./testData/index.js";
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
// const filterRows = () => "empty"
/*eslint-disable no-undef*/
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
