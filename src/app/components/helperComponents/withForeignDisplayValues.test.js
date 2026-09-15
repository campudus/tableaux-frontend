import { ColumnKinds } from "../../constants/TableauxConstants";
import {
  getConcatDisplayValues,
  getLinkDisplayValues
} from "./withForeignDisplayValues";

const langtag = "de-DE";

// table 1 links to table 2, the link column carries an attribute -- so a label
// belongs to one link, not to the target row several links share.
const linkAttributes = [{ name: "percentage", kind: "integer" }];
const formatPattern = "{{value}} ({{attributes.percentage}}%)";

const nameColumn = {
  id: 1,
  name: "name",
  kind: ColumnKinds.shorttext,
  multilanguage: true
};

const targetIdColumn = {
  id: 21,
  name: "name",
  kind: ColumnKinds.shorttext,
  multilanguage: true
};

const linkColumn = {
  id: 2,
  name: "material",
  kind: ColumnKinds.link,
  toTable: 2,
  toColumn: targetIdColumn,
  linkAttributes,
  formatPattern
};

const concatColumn = {
  id: 0,
  name: "ID",
  kind: ColumnKinds.concat,
  concats: [nameColumn, linkColumn]
};

// Column indices must stay stable across tests: getColumnIdx memoizes them by
// `${tableId}-${columnId}` for the whole module lifetime.
const buildState = ({ column = linkColumn, sourceLinkDisplayValue } = {}) => ({
  tables: { data: { 1: { id: 1 }, 2: { id: 2 } } },
  columns: {
    1: { data: [concatColumn, nameColumn, column] },
    2: { data: [targetIdColumn] }
  },
  rows: {},
  tableView: {
    displayValues: {
      1: [
        {
          id: 100,
          values: [
            { [langtag]: "unused" },
            { [langtag]: "Trikot" },
            sourceLinkDisplayValue
          ]
        }
      ],
      2: [
        { id: 10, values: [{ [langtag]: "Baumwolle" }] },
        { id: 11, values: [{ [langtag]: "Elastan" }] }
      ]
    }
  }
});

describe("getLinkDisplayValues()", () => {
  const links = [
    { id: 10, value: { [langtag]: "Baumwolle" }, attributes: [80] },
    { id: 11, value: { [langtag]: "Elastan" }, attributes: [20] }
  ];

  it("prefers the source row's own per-edge display value", () => {
    const state = buildState({
      sourceLinkDisplayValue: [
        { [langtag]: "Baumwolle (80%)" },
        { [langtag]: "Elastan (20%)" }
      ]
    });

    // taken verbatim: composing a second time would nest the attribute,
    // "Baumwolle (80%) (80%)"
    expect(
      getLinkDisplayValues({
        value: links,
        column: linkColumn,
        table: { id: 1 },
        row: { id: 100 }
      })(state)
    ).toEqual({
      foreignDisplayValues: [
        { [langtag]: "Baumwolle (80%)" },
        { [langtag]: "Elastan (20%)" }
      ]
    });
  });

  it("formats the target's identifier per edge when there is no own slot", () => {
    // no table/row: a link nested in a concat has no slot of its own to read,
    // so the shared identifier is composed here
    expect(
      getLinkDisplayValues({ value: links, column: linkColumn })(buildState())
    ).toEqual({
      foreignDisplayValues: [
        { [langtag]: "Baumwolle (80%)" },
        { [langtag]: "Elastan (20%)" }
      ]
    });
  });

  it("keeps two edges onto the same target row independent", () => {
    const sameTarget = [
      { id: 10, value: { [langtag]: "Baumwolle" }, attributes: [80] },
      { id: 10, value: { [langtag]: "Baumwolle" }, attributes: [20] }
    ];

    expect(
      getLinkDisplayValues({ value: sameTarget, column: linkColumn })(
        buildState()
      )
    ).toEqual({
      foreignDisplayValues: [
        { [langtag]: "Baumwolle (80%)" },
        { [langtag]: "Baumwolle (20%)" }
      ]
    });
  });

  it("leaves the identifier untouched without linkAttributes/formatPattern", () => {
    const plainColumn = {
      ...linkColumn,
      linkAttributes: undefined,
      formatPattern: undefined
    };

    expect(
      getLinkDisplayValues({ value: links, column: plainColumn })(
        buildState({ column: plainColumn })
      )
    ).toEqual({
      foreignDisplayValues: [
        { [langtag]: "Baumwolle" },
        { [langtag]: "Elastan" }
      ]
    });
  });

  it("returns taxonomy paths unformatted", () => {
    // composing a path array is out of scope, and the taxonomy branch returns
    // before the composing anyway
    const state = {
      ...buildState(),
      tables: { data: { 1: { id: 1 }, 2: { id: 2, type: "taxonomy" } } },
      rows: {
        2: {
          data: [
            {
              id: 9,
              cells: [{ column: targetIdColumn }],
              values: [{ [langtag]: "Fasern" }, null, null, []]
            },
            {
              id: 10,
              cells: [{ column: targetIdColumn }],
              values: [{ [langtag]: "Baumwolle" }, null, null, [{ id: 9 }]]
            }
          ]
        }
      }
    };

    expect(
      getLinkDisplayValues({
        value: [{ id: 10, attributes: [80] }],
        column: linkColumn
      })(state)
    ).toEqual({
      foreignDisplayValues: [
        [{ [langtag]: "Fasern" }, { [langtag]: "Baumwolle" }]
      ]
    });
  });
});

describe("getConcatDisplayValues()", () => {
  const concatCell = {
    table: { id: 1 },
    row: { id: 100 },
    column: concatColumn,
    value: [
      { [langtag]: "Trikot" },
      [
        { id: 10, value: { [langtag]: "Baumwolle" }, attributes: [80] },
        { id: 11, value: { [langtag]: "Elastan" }, attributes: [20] }
      ]
    ]
  };

  it("applies a link member's formatPattern", () => {
    expect(getConcatDisplayValues(concatCell, langtag)(buildState())).toEqual({
      foreignDisplayValues: "Trikot Baumwolle (80%) Elastan (20%)"
    });
  });

  it("leaves a link member without attributes unformatted", () => {
    const plainColumn = {
      ...linkColumn,
      linkAttributes: undefined,
      formatPattern: undefined
    };

    expect(
      getConcatDisplayValues(
        {
          ...concatCell,
          column: { ...concatColumn, concats: [nameColumn, plainColumn] }
        },
        langtag
      )(buildState({ column: plainColumn }))
    ).toEqual({ foreignDisplayValues: "Trikot Baumwolle Elastan" });
  });
});
