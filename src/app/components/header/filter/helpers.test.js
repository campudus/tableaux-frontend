import { fromCombinedFilter } from "./helpers";

describe("toCombinedFilter", () => {});

describe("fromCombinedFilter", () => {
  const columns = [{ name: "col-a" }, { name: "col-b" }, { name: "col-c" }];
  const fromFilters = fromCombinedFilter(columns);
  it("should create settings for a single filter", () => {
    expect(fromFilters(["value", "col-a", "equals", 12])).toEqual({
      column: { name: "col-a" },
      mode: "equals",
      value: 12
    });
  });
  it("should create settings for some AND-combined filters", () => {
    expect(
      fromFilters([
        "and",
        ["value", "col-a", "equals", 12],
        ["value", "col-b", "lte", 99]
      ])
    ).toEqual([
      { column: { name: "col-a" }, mode: "equals", value: 12 },
      { column: { name: "col-b" }, mode: "lte", value: 99 }
    ]);
  });
  it("should not fuck up with unknown filters", () => {
    expect(
      fromFilters([
        "and",
        ["row-prop", "archived", "is-set"],
        ["value", "col-c", "equals", "foo"]
      ])
    ).toEqual([{ column: { name: "col-c" }, mode: "equals", value: "foo" }]);
  });
});
