import { buildOriginColumnLookup } from "./columnHelper";
import getDisplayValue from "./getDisplayValue";

describe("getDisplayValue", () => {
  it("should format union table values", () => {
    const originTableId = 101;
    const minimalTable = { id: 112, type: "union" };
    const row = {
      id: 101000001,
      tableId: originTableId,
      values: [
        [
          {
            id: 1,
            value: ["singleLang", { "de-DE": "mehrsprachig" }]
          }
        ]
      ]
    };
    const originColumn = buildOriginColumnLookup(minimalTable, [
      unionLinkColumn
    ])(unionLinkColumn.id, originTableId);

    const result = getDisplayValue(
      { ...unionLinkColumn, originColumn, originColumns: undefined },
      row.values[0]
    );
    expect(result).toEqual([
      {
        "de-DE": "singleLang mehrsprachig"
      }
    ]);
  });

  it.only("should format union concats", () => {
    const value = getDisplayValue(unionConcatColumn, unionConcatRow.values[0]);
    expect(value).toEqual({});
  });

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

const unionLinkColumn = {
  id: 4,
  ordering: 4,
  name: "variant",
  kind: "link",
  multilanguage: true,
  identifier: false,
  displayName: {},
  description: {},
  separator: true,
  attributes: {},
  hidden: false,
  languageType: "language",
  originColumns: [
    {
      tableId: 101,
      column: {
        id: 5,
        ordering: 40,
        name: "variants",
        kind: "link",
        multilanguage: true,
        identifier: false,
        displayName: {
          "de-DE": "Variante",
          "en-GB": "Variant",
          "fr-FR": "Variante",
          "es-ES": "Variante"
        },
        description: {},
        separator: false,
        attributes: {},
        hidden: false,
        languageType: "language",
        toTable: 100,
        toColumn: {
          id: 0,
          ordering: 0,
          name: "ID",
          kind: "concat",
          multilanguage: true,
          identifier: true,
          displayName: {},
          description: {},
          separator: false,
          attributes: {},
          hidden: false,
          languageType: "language",
          concats: [
            {
              id: 1,
              ordering: 10,
              name: "articleNumber",
              kind: "shorttext",
              multilanguage: false,
              identifier: true,
              displayName: {
                "de-DE": "Artikelnummer",
                "en-GB": "Article number",
                "fr-FR": "Réf. article",
                "es-ES": "N° de artículo"
              },
              description: {},
              separator: true,
              attributes: {},
              hidden: false
            },
            {
              id: 4,
              ordering: 30,
              name: "identifier",
              kind: "shorttext",
              multilanguage: true,
              identifier: true,
              displayName: {
                "de-DE": "Bezeichnung",
                "en-GB": "Identifier",
                "fr-FR": "Désignation",
                "es-ES": "Descripción"
              },
              description: {},
              separator: true,
              attributes: {},
              hidden: false,
              languageType: "language"
            }
          ]
        },
        constraint: {
          cardinality: {
            from: 1,
            to: 0
          },
          deleteCascade: false,
          archiveCascade: false,
          finalCascade: false
        }
      }
    },
    {
      tableId: 103,
      column: {
        id: 5,
        ordering: 40,
        name: "variants",
        kind: "link",
        multilanguage: true,
        identifier: false,
        displayName: {
          "de-DE": "Variante",
          "en-GB": "Variant",
          "fr-FR": "Variante",
          "es-ES": "Variante"
        },
        description: {},
        separator: false,
        attributes: {},
        hidden: false,
        languageType: "language",
        toTable: 102,
        toColumn: {
          id: 0,
          ordering: 0,
          name: "ID",
          kind: "concat",
          multilanguage: true,
          identifier: true,
          displayName: {},
          description: {},
          separator: false,
          attributes: {},
          hidden: false,
          languageType: "language",
          concats: [
            {
              id: 1,
              ordering: 10,
              name: "articleNumber",
              kind: "shorttext",
              multilanguage: false,
              identifier: true,
              displayName: {
                "de-DE": "Artikelnummer",
                "en-GB": "Article number",
                "fr-FR": "Réf. article",
                "es-ES": "N° de artículo"
              },
              description: {},
              separator: true,
              attributes: {},
              hidden: false
            },
            {
              id: 4,
              ordering: 30,
              name: "identifier",
              kind: "shorttext",
              multilanguage: true,
              identifier: true,
              displayName: {
                "de-DE": "Bezeichnung",
                "en-GB": "Identifier",
                "fr-FR": "Désignation",
                "es-ES": "Descripción"
              },
              description: {},
              separator: true,
              attributes: {},
              hidden: false,
              languageType: "language"
            }
          ]
        },
        constraint: {
          cardinality: {
            from: 1,
            to: 0
          },
          deleteCascade: false,
          archiveCascade: false,
          finalCascade: false
        }
      }
    },
    {
      tableId: 105,
      column: {
        id: 5,
        ordering: 40,
        name: "variants",
        kind: "link",
        multilanguage: true,
        identifier: false,
        displayName: {
          "de-DE": "Variante",
          "en-GB": "Variant",
          "fr-FR": "Variante",
          "es-ES": "Variante"
        },
        description: {},
        separator: false,
        attributes: {},
        hidden: false,
        languageType: "language",
        toTable: 104,
        toColumn: {
          id: 0,
          ordering: 0,
          name: "ID",
          kind: "concat",
          multilanguage: true,
          identifier: true,
          displayName: {},
          description: {},
          separator: false,
          attributes: {},
          hidden: false,
          languageType: "language",
          concats: [
            {
              id: 1,
              ordering: 10,
              name: "articleNumber",
              kind: "shorttext",
              multilanguage: false,
              identifier: true,
              displayName: {
                "de-DE": "Artikelnummer",
                "en-GB": "Article number",
                "fr-FR": "Réf. article",
                "es-ES": "N° de artículo"
              },
              description: {},
              separator: true,
              attributes: {},
              hidden: false
            },
            {
              id: 4,
              ordering: 30,
              name: "identifier",
              kind: "shorttext",
              multilanguage: true,
              identifier: true,
              displayName: {
                "de-DE": "Bezeichnung",
                "en-GB": "Identifier",
                "fr-FR": "Désignation",
                "es-ES": "Descripción"
              },
              description: {},
              separator: true,
              attributes: {},
              hidden: false,
              languageType: "language"
            }
          ]
        },
        constraint: {
          cardinality: {
            from: 1,
            to: 0
          },
          deleteCascade: false,
          archiveCascade: false,
          finalCascade: false
        }
      }
    }
  ]
};

const unionConcatColumn = {
  id: 0,
  ordering: 0,
  name: "ID",
  kind: "concat",
  multilanguage: true,
  identifier: true,
  displayName: {},
  description: {},
  separator: false,
  attributes: {},
  hidden: false,
  languageType: "language",
  concats: [
    {
      id: 1,
      ordering: 1,
      name: "originTable",
      kind: "origintable",
      multilanguage: true,
      identifier: true,
      displayName: { "de-DE": "", de: "Ursprungstabelle", en: "Origin Table" },
      description: {
        de: "Der Tabellenname, aus der die Daten stammen",
        en: "The name of the table from which the data is taken"
      },
      separator: false,
      attributes: {},
      hidden: false,
      languageType: "language",
      permission: {
        editDisplayProperty: false,
        editStructureProperty: false,
        editCellValue: {
          "de-DE": false,
          "en-GB": false,
          "fr-FR": false,
          "es-ES": false,
          "it-IT": false
        },
        delete: false
      }
    },
    {
      id: 2,
      ordering: 2,
      name: "model-name",
      kind: "shorttext",
      multilanguage: false,
      identifier: true,
      displayName: { "de-DE": "Modellname Hersteller" },
      description: {},
      separator: true,
      attributes: {},
      hidden: false,
      originColumns: [
        {
          tableId: 101,
          column: {
            id: 1,
            ordering: 20,
            name: "modelName",
            kind: "shorttext",
            multilanguage: false,
            identifier: true,
            displayName: {
              "de-DE": "Modellname",
              "en-GB": "Model name",
              "fr-FR": "Nom du modèle",
              "es-ES": "Modelo"
            },
            description: {},
            separator: true,
            attributes: {},
            hidden: false
          }
        },
        {
          tableId: 103,
          column: {
            id: 1,
            ordering: 20,
            name: "modelName",
            kind: "shorttext",
            multilanguage: false,
            identifier: true,
            displayName: {
              "de-DE": "Modellname",
              "en-GB": "Model name",
              "fr-FR": "Nom du modèle",
              "es-ES": "Modelo"
            },
            description: {},
            separator: true,
            attributes: {},
            hidden: false
          }
        },
        {
          tableId: 105,
          column: {
            id: 1,
            ordering: 20,
            name: "modelName",
            kind: "shorttext",
            multilanguage: false,
            identifier: true,
            displayName: {
              "de-DE": "Modellname",
              "en-GB": "Model name",
              "fr-FR": "Nom du modèle",
              "es-ES": "Modelo"
            },
            description: {},
            separator: true,
            attributes: {},
            hidden: false
          }
        }
      ],
      permission: {
        editDisplayProperty: false,
        editStructureProperty: false,
        editCellValue: false,
        delete: false
      }
    },
    {
      id: 4,
      ordering: 4,
      name: "variant",
      kind: "link",
      multilanguage: true,
      identifier: true,
      displayName: {},
      description: {},
      separator: true,
      attributes: {},
      hidden: false,
      languageType: "language",
      originColumns: [
        {
          tableId: 101,
          column: {
            id: 5,
            ordering: 40,
            name: "variants",
            kind: "link",
            multilanguage: true,
            identifier: false,
            displayName: {
              "de-DE": "Variante",
              "en-GB": "Variant",
              "fr-FR": "Variante",
              "es-ES": "Variante"
            },
            description: {},
            separator: false,
            attributes: {},
            hidden: false,
            languageType: "language",
            toTable: 100,
            toColumn: {
              id: 0,
              ordering: 0,
              name: "ID",
              kind: "concat",
              multilanguage: true,
              identifier: true,
              displayName: {},
              description: {},
              separator: false,
              attributes: {},
              hidden: false,
              languageType: "language",
              concats: [
                {
                  id: 1,
                  ordering: 10,
                  name: "articleNumber",
                  kind: "shorttext",
                  multilanguage: false,
                  identifier: true,
                  displayName: {
                    "de-DE": "Artikelnummer",
                    "en-GB": "Article number",
                    "fr-FR": "Réf. article",
                    "es-ES": "N° de artículo"
                  },
                  description: {},
                  separator: true,
                  attributes: {},
                  hidden: false
                },
                {
                  id: 4,
                  ordering: 30,
                  name: "identifier",
                  kind: "shorttext",
                  multilanguage: true,
                  identifier: true,
                  displayName: {
                    "de-DE": "Bezeichnung",
                    "en-GB": "Identifier",
                    "fr-FR": "Désignation",
                    "es-ES": "Descripción"
                  },
                  description: {},
                  separator: true,
                  attributes: {},
                  hidden: false,
                  languageType: "language"
                }
              ]
            },
            constraint: {
              cardinality: { from: 1, to: 0 },
              deleteCascade: false,
              archiveCascade: false,
              finalCascade: false
            }
          }
        },
        {
          tableId: 103,
          column: {
            id: 5,
            ordering: 40,
            name: "variants",
            kind: "link",
            multilanguage: true,
            identifier: false,
            displayName: {
              "de-DE": "Variante",
              "en-GB": "Variant",
              "fr-FR": "Variante",
              "es-ES": "Variante"
            },
            description: {},
            separator: false,
            attributes: {},
            hidden: false,
            languageType: "language",
            toTable: 102,
            toColumn: {
              id: 0,
              ordering: 0,
              name: "ID",
              kind: "concat",
              multilanguage: true,
              identifier: true,
              displayName: {},
              description: {},
              separator: false,
              attributes: {},
              hidden: false,
              languageType: "language",
              concats: [
                {
                  id: 1,
                  ordering: 10,
                  name: "articleNumber",
                  kind: "shorttext",
                  multilanguage: false,
                  identifier: true,
                  displayName: {
                    "de-DE": "Artikelnummer",
                    "en-GB": "Article number",
                    "fr-FR": "Réf. article",
                    "es-ES": "N° de artículo"
                  },
                  description: {},
                  separator: true,
                  attributes: {},
                  hidden: false
                },
                {
                  id: 4,
                  ordering: 30,
                  name: "identifier",
                  kind: "shorttext",
                  multilanguage: true,
                  identifier: true,
                  displayName: {
                    "de-DE": "Bezeichnung",
                    "en-GB": "Identifier",
                    "fr-FR": "Désignation",
                    "es-ES": "Descripción"
                  },
                  description: {},
                  separator: true,
                  attributes: {},
                  hidden: false,
                  languageType: "language"
                }
              ]
            },
            constraint: {
              cardinality: { from: 1, to: 0 },
              deleteCascade: false,
              archiveCascade: false,
              finalCascade: false
            }
          }
        },
        {
          tableId: 105,
          column: {
            id: 5,
            ordering: 40,
            name: "variants",
            kind: "link",
            multilanguage: true,
            identifier: false,
            displayName: {
              "de-DE": "Variante",
              "en-GB": "Variant",
              "fr-FR": "Variante",
              "es-ES": "Variante"
            },
            description: {},
            separator: false,
            attributes: {},
            hidden: false,
            languageType: "language",
            toTable: 104,
            toColumn: {
              id: 0,
              ordering: 0,
              name: "ID",
              kind: "concat",
              multilanguage: true,
              identifier: true,
              displayName: {},
              description: {},
              separator: false,
              attributes: {},
              hidden: false,
              languageType: "language",
              concats: [
                {
                  id: 1,
                  ordering: 10,
                  name: "articleNumber",
                  kind: "shorttext",
                  multilanguage: false,
                  identifier: true,
                  displayName: {
                    "de-DE": "Artikelnummer",
                    "en-GB": "Article number",
                    "fr-FR": "Réf. article",
                    "es-ES": "N° de artículo"
                  },
                  description: {},
                  separator: true,
                  attributes: {},
                  hidden: false
                },
                {
                  id: 4,
                  ordering: 30,
                  name: "identifier",
                  kind: "shorttext",
                  multilanguage: true,
                  identifier: true,
                  displayName: {
                    "de-DE": "Bezeichnung",
                    "en-GB": "Identifier",
                    "fr-FR": "Désignation",
                    "es-ES": "Descripción"
                  },
                  description: {},
                  separator: true,
                  attributes: {},
                  hidden: false,
                  languageType: "language"
                }
              ]
            },
            constraint: {
              cardinality: { from: 1, to: 0 },
              deleteCascade: false,
              archiveCascade: false,
              finalCascade: false
            }
          }
        }
      ],
      permission: {
        editDisplayProperty: false,
        editStructureProperty: false,
        editCellValue: {
          "de-DE": false,
          "en-GB": false,
          "fr-FR": false,
          "es-ES": false,
          "it-IT": false
        },
        delete: false
      }
    }
  ],
  status: "ok"
};

const unionConcatRow = {
  id: 101000008,
  values: [
    [
      {
        "de-DE": "Giant Fahrradmodelle",
        "en-GB": "Giant Bike models",
        "fr-FR": "Giant Modèle",
        "es-ES": "Giant Modelo de bicicleta"
      },
      "Reign E+ 3 | V2",
      [
        { id: 29, value: ["5046002104", {}] },
        { id: 30, value: ["5046002105", {}] },
        { id: 31, value: ["5046002107", {}] },
        { id: 32, value: ["5046002108", {}] }
      ]
    ],
    {
      "de-DE": "Giant Fahrradmodelle",
      "en-GB": "Giant Bike models",
      "fr-FR": "Giant Modèle",
      "es-ES": "Giant Modelo de bicicleta"
    },
    "Reign E+ 3 | V2",
    [
      { id: 29, value: ["5046002104", {}] },
      { id: 30, value: ["5046002105", {}] },
      { id: 31, value: ["5046002107", {}] },
      { id: 32, value: ["5046002108", {}] }
    ]
  ],
  tableId: 101,
  status: "ok"
};
