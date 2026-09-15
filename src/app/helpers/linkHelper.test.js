import { describe, expect, it } from "vitest";
import { buildLinkDisplayValueCache } from "./linkHelper";

// One entry per TARGET row, shared by every link pointing at it, so it must
// hold that row's identifier and never a composed label. See
// docs/adr/0001-attribute-free-link-display-value-cache.md.
describe("buildLinkDisplayValueCache() - link attributes", () => {
  const toColumn = {
    id: 1,
    kind: "shorttext",
    multilanguage: true,
    name: "identifier"
  };
  const linkColumn = {
    id: 5,
    kind: "link",
    toTable: 1,
    toColumn,
    name: "material",
    linkAttributes: [{ name: "percentage", kind: "integer" }],
    formatPattern: "{{value}} ({{attributes.percentage}}%)"
  };
  const table = { id: 3 };
  const columns = [linkColumn];

  const rowLinking = (rowId, attributes) => ({
    id: rowId,
    tableId: 3,
    values: [[{ id: 1, value: { "de-DE": "Grau" }, attributes }]]
  });

  it("stores the target row's identifier, not the edge's formatted label", () => {
    const cache = buildLinkDisplayValueCache(table, columns, [
      rowLinking(10, [12])
    ]);

    expect(cache[1][0].value).toEqual([{ "de-DE": "Grau" }]);
  });

  it("does not leak one row's attributes into another row linking the same target", () => {
    const cache = buildLinkDisplayValueCache(table, columns, [
      rowLinking(10, [12]),
      rowLinking(11, [75])
    ]);

    // one shared entry for target row 1, carrying neither 12 nor 75
    expect(cache[1]).toHaveLength(1);
    expect(cache[1][0].value).toEqual([{ "de-DE": "Grau" }]);
  });

  it("is unaffected for link columns without linkAttributes", () => {
    const plainLink = { id: 5, kind: "link", toTable: 1, toColumn, name: "m" };
    const cache = buildLinkDisplayValueCache(
      table,
      [plainLink],
      [rowLinking(10, undefined)]
    );

    expect(cache[1][0].value).toEqual([{ "de-DE": "Grau" }]);
  });
});
