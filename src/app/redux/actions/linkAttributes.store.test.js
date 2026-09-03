import { describe, expect, it, vi } from "vitest";

vi.mock("../../helpers/apiHelper", () => ({ makeRequest: vi.fn() }));

import { makeRequest } from "../../helpers/apiHelper";
import store from "../store";
import { changeLinkAttributes } from "./cellActions";

const SRC = 3;
const TGT = 1;
const linkColumnId = 5;
const rowId = 10;
const linkId = 1;

const tgtIdent = {
  id: 1,
  kind: "shorttext",
  multilanguage: true,
  name: "identifier"
};
const srcIdent = {
  id: 50,
  kind: "shorttext",
  multilanguage: true,
  name: "srcIdent"
};
const linkColumn = {
  id: linkColumnId,
  kind: "link",
  toTable: TGT,
  toColumn: tgtIdent,
  name: "material",
  linkAttributes: [{ name: "percentage", kind: "integer" }],
  formatPattern: "{{value}} ({{attributes.percentage}}%)"
};

const initialCellValue = [{ id: linkId, value: { "de-DE": "Grau" } }];

const cell = {
  table: { id: SRC },
  column: linkColumn,
  row: { id: rowId },
  value: initialCellValue
};

// The store is a singleton, so every case seeds its own state.
const seedStore = () => {
  store.dispatch({
    type: "COLUMNS_DATA_LOADED",
    tableId: SRC,
    result: { columns: [srcIdent, linkColumn] }
  });
  store.dispatch({
    type: "SET_STATE",
    state: {
      ...store.getState(),
      tables: { data: { [SRC]: { id: SRC }, [TGT]: { id: TGT } } },
      rows: {
        [SRC]: {
          data: [
            { id: rowId, values: [{ "de-DE": "Rezept" }, initialCellValue] }
          ]
        }
      },
      tableView: {
        ...store.getState().tableView,
        displayValues: {
          [SRC]: [
            {
              id: rowId,
              values: [{ "de-DE": "Rezept" }, [{ "de-DE": "Grau" }]]
            }
          ],
          [TGT]: [{ id: linkId, values: [{ "de-DE": "Grau" }] }]
        }
      }
    }
  });
};

// After a write the composed label lives in the source row's link column,
// while the target table's own identifier stays unformatted.
describe("changeLinkAttributes: store displayValues after a write", () => {
  it("writes the formatted label into the source row's link column slot", async () => {
    seedStore();

    makeRequest.mockResolvedValue({
      status: "ok",
      value: [{ id: linkId, value: { "de-DE": "Grau" }, attributes: [12] }]
    });

    await store.dispatch(
      changeLinkAttributes({ cell, linkId, attributes: [12] })
    );

    const state = store.getState();

    // the slot the grid, LinkOverlay and EntityView read
    expect(state.tableView.displayValues[SRC][0].values[1]).toEqual([
      { "de-DE": "Grau (12%)" }
    ]);
    // raw cell value keeps the attributes
    expect(state.rows[SRC].data[0].values[1]).toEqual([
      { id: linkId, value: { "de-DE": "Grau" }, attributes: [12] }
    ]);
    // the target table's own identifier must stay unformatted
    expect(state.tableView.displayValues[TGT][0].values[0]).toEqual({
      "de-DE": "Grau"
    });
  });

  // Adopting a missing value would empty the link cell until the next reload.
  it("keeps the optimistic value when the response carries none", async () => {
    seedStore();

    const warn = vi.spyOn(console, "warn").mockImplementation(() => null);
    makeRequest.mockResolvedValue({ status: "ok" });

    await store.dispatch(
      changeLinkAttributes({ cell, linkId, attributes: [12] })
    );

    const state = store.getState();

    expect(state.rows[SRC].data[0].values[1]).toEqual([
      { id: linkId, value: { "de-DE": "Grau" }, attributes: [12] }
    ]);
    expect(state.tableView.displayValues[SRC][0].values[1]).toEqual([
      { "de-DE": "Grau (12%)" }
    ]);
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });
});
