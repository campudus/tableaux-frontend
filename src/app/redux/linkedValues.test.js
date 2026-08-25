import { describe, expect, it, vi } from "vitest";

vi.mock("../helpers/apiHelper", () => ({ makeRequest: vi.fn() }));

import { makeRequest } from "../helpers/apiHelper";
import {
  collectLinkedValueUpdates,
  columnCanHold,
  patchLinkedValue,
  refreshRows
} from "./linkedValues";

// Three tables, each one's identifier being the link to the next:
//
//   variant --link--> model --link--> manufacturer --shorttext "name"
//
// The manufacturer's name therefore ends up copied into a model row, and one
// level deeper into a variant row as well.

const manufacturerTableId = 1;
const modelTableId = 2;
const variantTableId = 3;

const manufacturerRowId = 100;
const modelRowId = 200;
const firstVariantRowId = 300;
const secondVariantRowId = 301;

// --- Column definitions, shaped like the ones the API sends: a link column
// --- carries the definition of the column it points at in `toColumn`.

const manufacturerNameColumnDefinition = {
  id: 10,
  name: "name",
  kind: "shorttext",
  identifier: true
};

const modelManufacturerColumnDefinition = {
  id: 20,
  name: "manufacturer",
  kind: "link",
  toTable: manufacturerTableId,
  toColumn: manufacturerNameColumnDefinition,
  identifier: true
};

const modelNameColumnDefinition = {
  id: 21,
  name: "modelName",
  kind: "shorttext",
  identifier: true
};

const modelIdentifierColumnDefinition = {
  id: 0,
  name: "ID",
  kind: "concat",
  concats: [modelManufacturerColumnDefinition, modelNameColumnDefinition]
};

const variantModelColumnDefinition = {
  id: 30,
  name: "model",
  kind: "link",
  toTable: modelTableId,
  toColumn: modelIdentifierColumnDefinition,
  identifier: true
};

const variantSizeColumnDefinition = {
  id: 31,
  name: "size",
  kind: "shorttext"
};

const variantIdentifierColumnDefinition = {
  id: 0,
  name: "ID",
  kind: "concat",
  concats: [variantModelColumnDefinition, variantSizeColumnDefinition]
};

// --- Cell values

const oldManufacturerName = "Tektro";
const newManufacturerName = "Tektro GmbH";
const modelName = "BR-R01";
const variantSize = "M";

// getDisplayValue() keys its result by langtag, whether the column is
// multilanguage or not. In tests only the default langtag exists.
const displayedAs = text => ({ "de-DE": text });

// What a link cell holds: the target row's id plus a copy of its identifier.
const linkTo = (rowId, identifierValue) => [
  { id: rowId, value: identifierValue }
];

// A concat identifier holds one value per member column.
const modelIdentifier = manufacturerName => [
  linkTo(manufacturerRowId, manufacturerName),
  modelName
];

const variantIdentifier = manufacturerName => [
  linkTo(modelRowId, modelIdentifier(manufacturerName)),
  variantSize
];

// --- Rows, values in the column order of the `columns` fixture below

const manufacturerRow = manufacturerName => ({
  id: manufacturerRowId,
  values: [manufacturerName]
});

const modelRow = manufacturerName => ({
  id: modelRowId,
  values: [
    modelIdentifier(manufacturerName),
    linkTo(manufacturerRowId, manufacturerName),
    modelName
  ]
});

const variantRow = (rowId, manufacturerName) => ({
  id: rowId,
  values: [
    variantIdentifier(manufacturerName),
    linkTo(modelRowId, modelIdentifier(manufacturerName)),
    variantSize
  ]
});

// The manufacturer row has already been renamed -- that is the state the
// propagation runs against, while the copies still hold the old name.
const buildState = () => ({
  tables: {
    data: {
      [manufacturerTableId]: { id: manufacturerTableId },
      [modelTableId]: { id: modelTableId },
      [variantTableId]: { id: variantTableId }
    }
  },
  columns: {
    [manufacturerTableId]: { data: [manufacturerNameColumnDefinition] },
    [modelTableId]: {
      data: [
        modelIdentifierColumnDefinition,
        modelManufacturerColumnDefinition,
        modelNameColumnDefinition
      ]
    },
    [variantTableId]: {
      data: [
        variantIdentifierColumnDefinition,
        variantModelColumnDefinition,
        variantSizeColumnDefinition
      ]
    }
  },
  rows: {
    [manufacturerTableId]: { data: [manufacturerRow(newManufacturerName)] },
    [modelTableId]: { data: [modelRow(oldManufacturerName)] },
    [variantTableId]: {
      data: [
        variantRow(firstVariantRowId, oldManufacturerName),
        variantRow(secondVariantRowId, oldManufacturerName)
      ]
    }
  }
});

// What the propagation distributes: the renamed row and its new identifier.
const renamedManufacturer = {
  tableId: manufacturerTableId,
  rowId: manufacturerRowId,
  value: newManufacturerName
};

describe("patchLinkedValue()", () => {
  it("replaces the copy a link column holds directly", () => {
    const modelsManufacturerCell = linkTo(
      manufacturerRowId,
      oldManufacturerName
    );

    expect(
      patchLinkedValue(
        modelManufacturerColumnDefinition,
        modelsManufacturerCell,
        renamedManufacturer
      )
    ).toEqual(linkTo(manufacturerRowId, newManufacturerName));
  });

  it("replaces a copy nested one level deeper", () => {
    const variantsModelCell = linkTo(
      modelRowId,
      modelIdentifier(oldManufacturerName)
    );

    expect(
      patchLinkedValue(
        variantModelColumnDefinition,
        variantsModelCell,
        renamedManufacturer
      )
    ).toEqual(linkTo(modelRowId, modelIdentifier(newManufacturerName)));
  });

  it("descends into the members of a concat column", () => {
    expect(
      patchLinkedValue(
        modelIdentifierColumnDefinition,
        modelIdentifier(oldManufacturerName),
        renamedManufacturer
      )
    ).toEqual(modelIdentifier(newManufacturerName));
  });

  // The identity checks below are what keep unaffected rows out of the payload,
  // and with them their objects out of the re-render.
  it("hands back the same value when another row is linked", () => {
    const linkToAnotherManufacturer = linkTo(999, "Shimano");

    expect(
      patchLinkedValue(
        modelManufacturerColumnDefinition,
        linkToAnotherManufacturer,
        renamedManufacturer
      )
    ).toBe(linkToAnotherManufacturer);
  });

  it("hands back the same value when the copy is already up to date", () => {
    const upToDate = linkTo(manufacturerRowId, newManufacturerName);

    expect(
      patchLinkedValue(
        modelManufacturerColumnDefinition,
        upToDate,
        renamedManufacturer
      )
    ).toBe(upToDate);
  });

  // Row ids are only unique within their table, so the id alone must never be
  // enough to match.
  it("does not match the same row id in a different table", () => {
    const columnPointingElsewhere = {
      ...modelManufacturerColumnDefinition,
      toTable: 4711
    };
    const sameIdOtherTable = linkTo(manufacturerRowId, "same id, other table");

    expect(
      patchLinkedValue(
        columnPointingElsewhere,
        sameIdOtherTable,
        renamedManufacturer
      )
    ).toBe(sameIdOtherTable);
  });

  it("keeps the rest of a link entry, e.g. its link attributes", () => {
    const withAttributes = [
      { id: manufacturerRowId, value: oldManufacturerName, attributes: [12] }
    ];

    expect(
      patchLinkedValue(
        modelManufacturerColumnDefinition,
        withAttributes,
        renamedManufacturer
      )
    ).toEqual([
      { id: manufacturerRowId, value: newManufacturerName, attributes: [12] }
    ]);
  });

  it("leaves a column that cannot hold a link alone", () => {
    expect(
      patchLinkedValue(
        manufacturerNameColumnDefinition,
        modelName,
        renamedManufacturer
      )
    ).toBe(modelName);
  });

  it("does not hang on a cyclic column definition", () => {
    const first = { id: 1, kind: "link", toTable: 4711 };
    const second = { id: 2, kind: "link", toTable: 4712, toColumn: first };
    first.toColumn = second;

    expect(() =>
      patchLinkedValue(
        first,
        [{ id: 1, value: [{ id: 2, value: [] }] }],
        renamedManufacturer
      )
    ).not.toThrow();
  });
});

// Decides which column positions the row scan has to visit at all.
describe("columnCanHold()", () => {
  it("sees a column linking directly to the table", () => {
    expect(
      columnCanHold(modelManufacturerColumnDefinition, manufacturerTableId)
    ).toBe(true);
  });

  it("sees a link hidden in the identifier of the linked table", () => {
    expect(
      columnCanHold(variantModelColumnDefinition, manufacturerTableId)
    ).toBe(true);
  });

  it("is false for an unrelated table", () => {
    expect(columnCanHold(variantModelColumnDefinition, 4711)).toBe(false);
  });

  it("is false for a column without any link", () => {
    expect(columnCanHold(modelNameColumnDefinition, manufacturerTableId)).toBe(
      false
    );
  });
});

describe("collectLinkedValueUpdates()", () => {
  const updatesByTableId = state =>
    collectLinkedValueUpdates(state, {
      tableId: manufacturerTableId,
      rowId: manufacturerRowId
    }).reduce((byTableId, update) => {
      byTableId[update.tableId] = update;
      return byTableId;
    }, {});

  it("updates the row one level up: the model linking the manufacturer", () => {
    const modelUpdate = updatesByTableId(buildState())[modelTableId];

    expect(modelUpdate.rows.map(row => row.id)).toEqual([modelRowId]);
    // the link column itself ...
    expect(modelUpdate.rows[0].values[1]).toEqual(
      linkTo(manufacturerRowId, newManufacturerName)
    );
    // ... and the identifier concat, which embeds the same link
    expect(modelUpdate.rows[0].values[0]).toEqual(
      modelIdentifier(newManufacturerName)
    );
  });

  it("updates the rows two levels up in the same pass", () => {
    const variantUpdate = updatesByTableId(buildState())[variantTableId];

    expect(variantUpdate.rows.map(row => row.id)).toEqual([
      firstVariantRowId,
      secondVariantRowId
    ]);
    expect(variantUpdate.rows[0].values[1]).toEqual(
      linkTo(modelRowId, modelIdentifier(newManufacturerName))
    );
  });

  it("recomputes only the display values of the changed positions", () => {
    const variantUpdate = updatesByTableId(buildState())[variantTableId];
    const { displayValueUpdates } = variantUpdate.rows[0];

    // the identifier concat and the link column, not the untouched size column
    expect(Object.keys(displayValueUpdates).sort()).toEqual(["0", "1"]);
    expect(displayValueUpdates[1]).toEqual([displayedAs("Tektro GmbH BR-R01")]);
  });

  it("leaves out rows that link a different manufacturer", () => {
    const state = buildState();
    const otherManufacturerRowId = 101;
    const otherModelRowId = 201;
    const otherModelIdentifier = [
      linkTo(otherManufacturerRowId, "Shimano"),
      "BL-9000"
    ];

    // The second variant links a model of another manufacturer instead.
    state.rows[variantTableId].data[1] = {
      id: secondVariantRowId,
      values: [
        [linkTo(otherModelRowId, otherModelIdentifier), variantSize],
        linkTo(otherModelRowId, otherModelIdentifier),
        variantSize
      ]
    };

    const variantUpdate = updatesByTableId(state)[variantTableId];

    expect(variantUpdate.rows.map(row => row.id)).toEqual([firstVariantRowId]);
  });

  it("leaves out tables that hold no copy at all", () => {
    // nothing links to the manufacturer table from within itself
    expect(updatesByTableId(buildState())[manufacturerTableId]).toBe(undefined);
  });

  // A row's own concat value is only refreshed once its cell write came back,
  // so the identifier has to be assembled from the member columns. Reading the
  // stored copy instead is what made linking and unlinking look like a no-op.
  it("builds a concat identifier from its member columns", () => {
    const state = buildState();
    const manufacturerLink = linkTo(manufacturerRowId, newManufacturerName);

    // The manufacturer has just been linked: the link column already holds it,
    // the stored concat value at index 0 does not.
    state.rows[modelTableId] = {
      data: [
        {
          id: modelRowId,
          values: [[[], modelName], manufacturerLink, modelName]
        }
      ]
    };

    const [variantUpdate, ...rest] = collectLinkedValueUpdates(state, {
      tableId: modelTableId,
      rowId: modelRowId
    });

    expect(rest).toEqual([]);
    expect(variantUpdate.tableId).toBe(variantTableId);
    expect(variantUpdate.rows[0].values[1]).toEqual(
      linkTo(modelRowId, [manufacturerLink, modelName])
    );
  });

  // Distributing an identifier that could not be read would replace every
  // label of that row with an empty one.
  it("leaves every copy alone when the changed row is not in the store", () => {
    const state = buildState();
    state.rows[manufacturerTableId] = { data: [] };

    expect(
      collectLinkedValueUpdates(state, {
        tableId: manufacturerTableId,
        rowId: manufacturerRowId
      })
    ).toEqual([]);
  });

  // No gate on "was this an identifier column?" is needed: a value nobody
  // embeds simply produces no payload.
  it("is empty when the identifier did not actually change", () => {
    const state = buildState();
    state.rows[manufacturerTableId] = {
      data: [manufacturerRow(oldManufacturerName)]
    };

    expect(
      collectLinkedValueUpdates(state, {
        tableId: manufacturerTableId,
        rowId: manufacturerRowId
      })
    ).toEqual([]);
  });

  it("is empty when no table links to the changed one", () => {
    expect(
      collectLinkedValueUpdates(buildState(), {
        tableId: variantTableId,
        rowId: firstVariantRowId
      })
    ).toEqual([]);
  });
});

describe("refreshRows()", () => {
  const dispatch = vi.fn();
  const getState = () => buildState();

  it("fetches the row and dispatches what it now holds", async () => {
    makeRequest.mockClear();
    dispatch.mockClear();
    makeRequest.mockResolvedValue(modelRow(newManufacturerName));

    await refreshRows(modelTableId, [modelRowId])(dispatch, getState);

    expect(makeRequest.mock.calls.length).toBe(1);
    expect(String(makeRequest.mock.calls[0][0].apiRoute)).toContain(
      `/tables/${modelTableId}/rows/${modelRowId}`
    );

    const [{ updates }] = dispatch.mock.calls[0];
    expect(updates[0].tableId).toBe(modelTableId);
    expect(updates[0].rows[0].id).toBe(modelRowId);
  });

  // The refetched row's own identifier may have changed as well -- its backlink
  // column can be part of it -- so its copies elsewhere have to follow.
  it("propagates the refetched row afterwards", async () => {
    makeRequest.mockClear();
    dispatch.mockClear();
    makeRequest.mockResolvedValue(modelRow(newManufacturerName));

    await refreshRows(modelTableId, [modelRowId])(dispatch, getState);

    expect(dispatch.mock.calls.length).toBe(2);
    // a thunk, i.e. propagateLinkedValues(...)
    expect(typeof dispatch.mock.calls[1][0]).toBe("function");
  });

  it("fetches nothing for a row that is not in the store", async () => {
    makeRequest.mockClear();
    dispatch.mockClear();

    await refreshRows(modelTableId, [4711])(dispatch, getState);

    expect(makeRequest).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });
});
