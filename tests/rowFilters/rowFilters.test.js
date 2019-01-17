import data from "./winoraTable77.json";
import f from "lodash/fp";
import getFilteredRows from "../../src/app/components/table/RowFilters";
import expectedFilterResults from "./expectedResults/expectedFilterResults.json";
import sortTextResult from "./expectedResults/sortText.json";
import sortTextResultDesc from "./expectedResults/sortTextDesc.json";
const { currentTable, rows, columns, langtag, filterSettings } = data;
const {
  anyColumnContainsEmptyString,
  anyColumnContainsRadiu,
  needsTranslation
} = expectedFilterResults;
const emptyFilter = { sortColumnId: NaN, sortValue: "", filters: [] };

const filterRows = filters =>
  getFilteredRows(currentTable, rows, columns, langtag, filters);

/*eslint-disable no-undef*/

test("any column contains radius: ", () =>
  expect(f.map("id", filterRows(filterSettings))).toEqual(
    anyColumnContainsRadiu
  ));
test("any column contains empty string: ", () => {
  expect(
    filterRows(f.set(["filters", "value", "", filterSettings])).length
  ).toBe(anyColumnContainsEmptyString);
});

describe("translation needed:", () => {
  const needsTranslationFilter = {
    filters: [
      {
        columnId: NaN,
        columnKind: "boolean",
        mode: "ANY_UNTRANSLATED",
        value: true
      }
    ],
    sortColumnId: NaN,
    sortValue: "ASC"
  };
  test("true", () => {
    expect(f.map("id", filterRows(needsTranslationFilter))).toEqual(
      needsTranslation
    );
  });
  // test("false", () => {
  //   expect(
  //     f.map(
  //       "id",
  //         filterRows(
  //         f.set(["filters", 0, "value"], false, needsTranslationFilter)
  //       )
  //     )
  //   ).toEqual(needsTranslation);
  // });
});
const mapIndexed = f.map.convert({cap:false});
describe("sorting", () => {
  console.log("test")
  const sortFilter = { ...emptyFilter, sortColumnId: NaN, sortValue: "asc" };
  describe("text", () => {
    const sortTextFilter = { ...sortFilter, sortColumnId: 88 };
    test("ascending", () =>
      expect(f.map("id", filterRows(sortTextFilter))).toEqual(sortTextResult));
    // test("descending", () =>
    //   expect(f.map("id", filterRows({...sortTextFilter, sortValue:"DESC"}))).toEqual(sortTextResultDesc));
    mapIndexed((id,index)=>{
      if(id != sortTextResultDesc[index]){
        console.log(id,sortTextResultDesc[index],index);
      }
    }, f.map("id",filterRows({...sortTextFilter, sortValue:"DESC"})));
  });
  describe("", () => {
    test("ascending", () => expect().toEqual());
    test("descending", () => expect().toEqual());
  });
  describe("", () => {
    test("ascending", () => expect().toEqual());
    test("descending", () => expect().toEqual());
  });
  describe("", () => {
    test("ascending", () => expect().toEqual());
    test("descending", () => expect().toEqual());
  });
  describe("", () => {
    test("ascending", () => expect().toEqual());
    test("descending", () => expect().toEqual());
  });
  describe("", () => {
    test("ascending", () => expect().toEqual());
    test("descending", () => expect().toEqual());
  });
  describe("", () => {
    test("ascending", () => expect().toEqual());
    test("descending", () => expect().toEqual());
  });
  describe("", () => {
    test("ascending", () => expect().toEqual());
    test("descending", () => expect().toEqual());
  });
});
