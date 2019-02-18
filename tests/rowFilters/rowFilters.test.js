import data from "./testData/winoraTable77.json";
import f from "lodash/fp";
// import getFilteredRows from "../../src/app/components/table/RowFilters";
import testData from "./testData/index.js";
const { rows, columns} = data;
const langtag = "de";
const currentTable = 77;

// const filterRows = filters =>
//   getFilteredRows(currentTable, rows, columns, langtag, filters);
const filterRows = () => "empty"
/*eslint-disable no-undef*/

describe("Filter:", () => {
  f.compose(
    f.each(arr => {
      const [description, values] = arr;
      if (!f.includes("Sort", description)) {
        const { visibleRows, rowsFilter } = values;
        test(description, () => {
          const result = f.get("visibleRows", filterRows(rowsFilter));
          expect(result).toEqual(visibleRows);
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
          const result = f.get("visibleRows", filterRows(rowsFilter));
          expect(result).toEqual(visibleRows);
        });
      }
    }),
    f.toPairs
  )(testData);
});
