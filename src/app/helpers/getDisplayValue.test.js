import getDisplayValue from "./getDisplayValue";

describe("getDisplayValue", () => {
  it("should format concatFormatPattern correctly", () => {
    const column = {
      id: 0,
      name: "ID",
      kind: "concat",
      formatPattern: "{{1}} {{2}} {{7}} {{8}} {{39}}x{{40}}mm",
      concats: [
        {
          id: 1,
          name: "identifier",
          kind: "shorttext",
          multilanguage: true
        },
        {
          id: 2,
          name: "frameShape",
          kind: "link",
          multilanguage: true,
          toTable: 89,
          toColumn: {
            id: 1,
            name: "identifier",
            kind: "shorttext",
            multilanguage: true
          }
        },
        {
          id: 7,
          name: "material",
          kind: "link",
          multilanguage: true,
          toTable: 1,
          toColumn: {
            id: 1,
            name: "identifier",
            kind: "shorttext",
            multilanguage: true
          }
        },
        {
          id: 8,
          name: "frameSize",
          kind: "link",
          multilanguage: false,
          toTable: 90,
          toColumn: {
            id: 1,
            name: "identifier",
            kind: "shorttext",
            multilanguage: false
          }
        },
        {
          id: 39,
          name: "axleDiameter",
          kind: "numeric",
          multilanguage: false
        },
        {
          id: 40,
          name: "hubInstallationWidth",
          kind: "numeric",
          multilanguage: false
        }
      ]
    };
    const rowValue = [
      { "de-DE": "Reign Advanced E+ 0" },
      [],
      [
        { id: 10, value: { "de-DE": "Advanced Carbon" } },
        { id: 11, value: { "de-DE": "Steel" } }
      ],
      [{ id: 3, value: "S" }],
      12,
      148
    ];
    const displayValue = getDisplayValue(column)(rowValue);

    expect(displayValue).toEqual({
      "de-DE": "Reign Advanced E+ 0 _ Advanced Carbon Steel S 12x148mm"
    });
  });
});
