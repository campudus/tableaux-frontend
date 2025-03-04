import { describe, expect, it } from "vitest";
import columnResponse from "./__fixtures/modelColumns.json";

import { calcColumnDependencies } from "./updateDependentTables";

describe("Dependent state updates", () => {
  const columnCollection = { 95: { data: columnResponse.columns } };
  describe("calcColumnDependencies()", () => {
    it("does stuff", () => {
      const dependencyMap = calcColumnDependencies(columnCollection);
      expect(dependencyMap[69][95]).toEqual([60]);
      expect(dependencyMap).toMatchSnapshot();
    });
  });
});
