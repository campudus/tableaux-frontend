import RowFilters from "./index";
import { ColumnKinds } from "../constants/TableauxConstants";

const langtag = "de-DE";
const SRC = 1;
const TGT = 2;

// A formatted link column contributes both its attribute value and emphasis
// markup to every display value embedding it -- the identifier concat here.
// Filters and sorting must match the plain text the user reads.
const targetIdColumn = {
  id: 20,
  name: "targetName",
  kind: ColumnKinds.shorttext,
  multilanguage: true
};

const linkColumn = {
  id: 2,
  name: "material",
  kind: ColumnKinds.link,
  toTable: TGT,
  toColumn: targetIdColumn,
  linkAttributes: [{ name: "percentage", kind: "integer" }],
  formatPattern: "{{value}} <em>{{attributes.percentage}}%</em>"
};

const nameColumn = {
  id: 1,
  name: "name",
  kind: ColumnKinds.shorttext,
  multilanguage: true
};

const concatColumn = {
  id: 0,
  name: "ID",
  kind: ColumnKinds.concat,
  concats: [nameColumn, linkColumn]
};

const links = [{ id: 10, value: { [langtag]: "Grau" }, attributes: [12] }];

// The concat column's own cell value is the array of its members' values.
const row = {
  id: 100,
  values: [[{ [langtag]: "Trikot" }, links], { [langtag]: "Trikot" }, links]
};

// The stored display value is what the worker computes -- markup included.
const buildStore = () => ({
  columns: { [SRC]: { data: [concatColumn, nameColumn, linkColumn] } },
  rows: { [SRC]: { data: [row] } },
  tableView: {
    displayValues: {
      [SRC]: [
        {
          id: 100,
          values: [
            { [langtag]: "Trikot Grau <em>12%</em>" },
            { [langtag]: "Trikot" },
            [{ [langtag]: "Grau <em>12%</em>" }]
          ]
        }
      ]
    }
  }
});

const buildContext = () => RowFilters.buildContext(SRC, langtag, buildStore());

// sortRows() compares whatever ctx.getValue() returns, so the cases below
// cover the sort order as well.
describe("buildContext(): values used for filtering and sorting", () => {
  it("keeps the formatPattern markup out of a concat column's value", () => {
    expect(buildContext().getValue("ID")(row)).toBe("Trikot Grau 12%");
  });

  it("keeps it out of the display value the any-column filter reads", () => {
    expect(buildContext().getDisplayValue("ID", row)).toBe("Trikot Grau 12%");
  });

  it("resolves a link column per edge, formatted and without markup", () => {
    expect(buildContext().getValue("material")(row)).toEqual(["Grau 12%"]);
  });

  it("leaves a plain text column untouched", () => {
    expect(buildContext().getValue("name")(row)).toBe("Trikot");
  });
});

describe("parse(): filtering a column that embeds a link label", () => {
  const matches = (setting, ctx = buildContext()) =>
    RowFilters.parse(ctx)(setting)(row);

  it("matches across the attribute value in a concat column", () => {
    expect(matches(["value", "ID", "contains", "Trikot Grau 12"])).toBe(true);
  });

  it("matches the attribute value of a link column", () => {
    expect(matches(["value", "material", "contains", "12%"])).toBe(true);
  });

  it("does not match the markup itself", () => {
    expect(matches(["value", "ID", "contains", "<em>"])).toBe(false);
    expect(matches(["value", "material", "contains", "<em>"])).toBe(false);
  });

  it("matches across the label in the any-column filter", () => {
    const columnMatches = { get: () => new Set() };
    const pred = RowFilters.parse(buildContext())([
      "any-value",
      "contains",
      "Trikot Grau 12"
    ]);

    expect(pred(row, 0, columnMatches)).toBe(true);
  });
});
