import columnResponse from "./__fixtures/modelColumns.json";

import {
  calcColumnDependencies,
  dependencyMapMemoKey
} from "./updateDependentTables";

describe("Dependent state updates", () => {
  const columnCollection = { 95: { data: columnResponse.columns } };
  describe("calcColumnDependencies()", () => {
    it("does stuff", () => {
      const dependencyMap = calcColumnDependencies(columnCollection);
      expect(dependencyMap[69][95]).toEqual([60]);
      expect(dependencyMap).toMatchSnapshot();
    });

    it("yields no dependencies for a table whose columns are still loading", () => {
      const dependencyMap = calcColumnDependencies({
        3: { data: [{ id: 5, kind: "link", toTable: 1 }] },
        // what COLUMNS_LOADING_DATA puts in the store: no `data` yet
        1: { error: false, finishedLoading: false }
      });
      expect(dependencyMap).toEqual({ 1: { 3: [5] } });
    });
  });

  // Regression: with the bare list of table ids as the key, the incomplete map
  // computed during COLUMNS_LOADING_DATA was reused after COLUMNS_DATA_LOADED.
  describe("dependencyMapMemoKey()", () => {
    it("counts only the tables whose columns have arrived", () => {
      expect(
        dependencyMapMemoKey({
          3: { data: [{ id: 5, kind: "link", toTable: 1 }] },
          1: { error: false, finishedLoading: false }
        })
      ).toBe("3");
    });

    it("changes once they have", () => {
      expect(
        dependencyMapMemoKey({
          3: { data: [] },
          1: { data: [] }
        })
      ).toBe("1,3");
    });
  });
});
