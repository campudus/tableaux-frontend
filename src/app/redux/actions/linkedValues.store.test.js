import { describe, expect, it, vi } from "vitest";

vi.mock("../../helpers/apiHelper", () => ({ makeRequest: vi.fn() }));

import { makeRequest } from "../../helpers/apiHelper";
import store from "../store";
import { changeCellValue } from "./cellActions";

// Driven through the real store:
//
//   variant --link--> model --link--> manufacturer --shorttext "name"
//
// The variant table is the open one. A change two levels down has to show up in
// both other tables, without a request beyond the cell write itself.

const manufacturerTableId = 71;
const modelTableId = 72;
const variantTableId = 73;

const manufacturerRowId = 100;
const modelRowId = 200;
const variantRowId = 300;

const manufacturerNameColumnDefinition = {
  id: 710,
  name: "name",
  kind: "shorttext",
  identifier: true
};

const modelManufacturerColumnDefinition = {
  id: 720,
  name: "manufacturer",
  kind: "link",
  toTable: manufacturerTableId,
  toColumn: manufacturerNameColumnDefinition,
  identifier: true
};

const modelNameColumnDefinition = {
  id: 721,
  name: "modelName",
  kind: "shorttext",
  identifier: true
};

const modelIdentifierColumnDefinition = {
  id: 0,
  name: "ID",
  kind: "concat",
  identifier: true,
  concats: [modelManufacturerColumnDefinition, modelNameColumnDefinition]
};

const variantModelColumnDefinition = {
  id: 730,
  name: "model",
  kind: "link",
  toTable: modelTableId,
  toColumn: modelIdentifierColumnDefinition,
  identifier: true
};

const variantIdentifierColumnDefinition = {
  id: 0,
  name: "ID",
  kind: "concat",
  identifier: true,
  concats: [variantModelColumnDefinition]
};

const oldManufacturerName = "Tektro";
const newManufacturerName = "Tektro GmbH";
const modelName = "BR-R01";

// getDisplayValue() keys its result by langtag, whether the column is
// multilanguage or not. In tests only the default langtag exists.
const displayedAs = text => ({ "de-DE": text });

// The model's identifier concatenates its manufacturer and its own name, so
// these are the labels every table showing the model has to end up with.
const labelWithoutManufacturer = displayedAs(modelName);
const labelWithManufacturer = displayedAs("Tektro BR-R01");
const labelWithRenamedManufacturer = displayedAs("Tektro GmbH BR-R01");

// What a link cell holds: the target row's id plus a copy of its identifier.
const linkTo = (rowId, identifierValue) => [
  { id: rowId, value: identifierValue }
];

const modelIdentifier = manufacturerLink => [manufacturerLink, modelName];

const noManufacturer = [];
const linkedManufacturer = linkTo(manufacturerRowId, oldManufacturerName);

// `manufacturerLink` is the model's manufacturer cell, `modelLabel` the label
// its identifier produces with that link in place.
const seedStore = ({ manufacturerLink, modelLabel }) => {
  [
    {
      tableId: manufacturerTableId,
      columns: [manufacturerNameColumnDefinition]
    },
    {
      tableId: modelTableId,
      columns: [
        modelIdentifierColumnDefinition,
        modelManufacturerColumnDefinition,
        modelNameColumnDefinition
      ]
    },
    {
      tableId: variantTableId,
      columns: [variantIdentifierColumnDefinition, variantModelColumnDefinition]
    }
  ].forEach(({ tableId, columns }) =>
    store.dispatch({
      type: "COLUMNS_DATA_LOADED",
      tableId,
      result: { columns }
    })
  );

  store.dispatch({
    type: "SET_STATE",
    state: {
      ...store.getState(),
      tables: {
        data: {
          [manufacturerTableId]: { id: manufacturerTableId },
          [modelTableId]: { id: modelTableId },
          [variantTableId]: { id: variantTableId }
        }
      },
      rows: {
        [manufacturerTableId]: {
          data: [{ id: manufacturerRowId, values: [oldManufacturerName] }]
        },
        [modelTableId]: {
          data: [
            {
              id: modelRowId,
              values: [
                modelIdentifier(manufacturerLink),
                manufacturerLink,
                modelName
              ]
            }
          ]
        },
        [variantTableId]: {
          data: [
            {
              id: variantRowId,
              values: [
                [linkTo(modelRowId, modelIdentifier(manufacturerLink))],
                linkTo(modelRowId, modelIdentifier(manufacturerLink))
              ]
            }
          ]
        }
      },
      tableView: {
        ...store.getState().tableView,
        displayValues: {
          [manufacturerTableId]: [
            {
              id: manufacturerRowId,
              values: [displayedAs(oldManufacturerName)]
            }
          ],
          [modelTableId]: [
            {
              id: modelRowId,
              values: [
                modelLabel,
                manufacturerLink.map(link => displayedAs(link.value)),
                displayedAs(modelName)
              ]
            }
          ],
          [variantTableId]: [
            { id: variantRowId, values: [modelLabel, [modelLabel]] }
          ]
        }
      }
    }
  });
};

const displayValues = () => store.getState().tableView.displayValues;

const modelsManufacturerLabel = () =>
  displayValues()[modelTableId][0].values[1];
const modelsIdentifierLabel = () => displayValues()[modelTableId][0].values[0];
const variantsModelLabel = () => displayValues()[variantTableId][0].values[1];
const variantsIdentifierLabel = () =>
  displayValues()[variantTableId][0].values[0];

const renameManufacturer = () =>
  store.dispatch(
    changeCellValue({
      cell: {
        id: `cell-${manufacturerTableId}-710-${manufacturerRowId}`,
        table: { id: manufacturerTableId },
        column: manufacturerNameColumnDefinition,
        row: { id: manufacturerRowId },
        value: oldManufacturerName
      },
      oldValue: oldManufacturerName,
      newValue: newManufacturerName,
      dontClear: true
    })
  );

const setModelsManufacturer = ({ from, to }) =>
  store.dispatch(
    changeCellValue({
      cell: {
        id: `cell-${modelTableId}-720-${modelRowId}`,
        table: { id: modelTableId },
        column: modelManufacturerColumnDefinition,
        row: { id: modelRowId },
        value: from
      },
      oldValue: from,
      newValue: to,
      dontClear: true
    })
  );

describe("renaming a row two link levels down", () => {
  it("reaches every table that shows it, with no extra request", async () => {
    seedStore({
      manufacturerLink: linkedManufacturer,
      modelLabel: labelWithManufacturer
    });
    makeRequest.mockClear();
    makeRequest.mockResolvedValue({ status: "ok" });

    const pending = renameManufacturer();

    // optimistic: everything is in place before the request settles
    expect(variantsModelLabel()).toEqual([labelWithRenamedManufacturer]);

    await pending;

    // the changed row itself
    expect(displayValues()[manufacturerTableId][0].values[0]).toEqual(
      displayedAs(newManufacturerName)
    );
    // one level up: the model's link column and its identifier
    expect(modelsManufacturerLabel()).toEqual([
      displayedAs(newManufacturerName)
    ]);
    expect(modelsIdentifierLabel()).toEqual(labelWithRenamedManufacturer);
    // two levels up: the open variant table
    expect(variantsModelLabel()).toEqual([labelWithRenamedManufacturer]);
    expect(variantsIdentifierLabel()).toEqual(labelWithRenamedManufacturer);

    // exactly one request: the cell write, everything else was derived
    expect(makeRequest.mock.calls.length).toBe(1);
    expect(makeRequest.mock.calls[0][0].method).toBe("POST");
  });

  it("puts the old value back everywhere when the write fails", async () => {
    seedStore({
      manufacturerLink: linkedManufacturer,
      modelLabel: labelWithManufacturer
    });
    makeRequest.mockClear();
    makeRequest.mockRejectedValue(new Error("nope"));

    const pending = renameManufacturer();

    // it really was distributed first, or the assertions below would also hold
    // for "nothing ever happened"
    expect(variantsModelLabel()).toEqual([labelWithRenamedManufacturer]);

    await pending.catch(() => null);

    expect(modelsManufacturerLabel()).toEqual([
      displayedAs(oldManufacturerName)
    ]);
    expect(variantsModelLabel()).toEqual([labelWithManufacturer]);
  });
});

// Adding or removing a link changes the identifier of the row holding it, so
// the same propagation has to run.
describe("linking and unlinking in an identifier column", () => {
  // The cell write is answered by method, the backlink refetch is a plain GET.
  const mockBackend = () =>
    makeRequest.mockImplementation(({ method }) =>
      Promise.resolve(
        method
          ? { status: "ok" }
          : { id: manufacturerRowId, values: [oldManufacturerName] }
      )
    );

  it("adds the linked row's label to every table showing the model", async () => {
    seedStore({
      manufacturerLink: noManufacturer,
      modelLabel: labelWithoutManufacturer
    });
    makeRequest.mockClear();
    mockBackend();

    const pending = setModelsManufacturer({
      from: noManufacturer,
      to: linkedManufacturer
    });

    expect(variantsModelLabel()).toEqual([labelWithManufacturer]);

    await pending;

    expect(modelsIdentifierLabel()).toEqual(labelWithManufacturer);
    expect(variantsModelLabel()).toEqual([labelWithManufacturer]);
    expect(variantsIdentifierLabel()).toEqual(labelWithManufacturer);
  });

  it("takes it away again when the link is removed", async () => {
    seedStore({
      manufacturerLink: linkedManufacturer,
      modelLabel: labelWithManufacturer
    });
    makeRequest.mockClear();
    mockBackend();

    const pending = setModelsManufacturer({
      from: linkedManufacturer,
      to: noManufacturer
    });

    expect(variantsModelLabel()).toEqual([labelWithoutManufacturer]);

    await pending;

    expect(modelsIdentifierLabel()).toEqual(labelWithoutManufacturer);
    expect(variantsModelLabel()).toEqual([labelWithoutManufacturer]);
    expect(variantsIdentifierLabel()).toEqual(labelWithoutManufacturer);
  });

  // The one thing the frontend cannot derive: which column mirrors the link.
  it("refetches only the row on the other side of the edge", async () => {
    seedStore({
      manufacturerLink: noManufacturer,
      modelLabel: labelWithoutManufacturer
    });
    makeRequest.mockClear();
    mockBackend();

    await setModelsManufacturer({
      from: noManufacturer,
      to: linkedManufacturer
    });

    const routesOf = calls =>
      calls.map(([{ method, apiRoute }]) => `${method || "GET"} ${apiRoute}`);

    expect(routesOf(makeRequest.mock.calls)).toEqual([
      `PUT /tables/${modelTableId}/columns/720/rows/${modelRowId}`,
      `GET /tables/${manufacturerTableId}/rows/${manufacturerRowId}`
    ]);
  });
});
