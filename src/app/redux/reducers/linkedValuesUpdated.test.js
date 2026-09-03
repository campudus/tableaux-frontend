import { describe, expect, it } from "vitest";
// NB: importing the slice reducers directly triggers a module-init cycle via
// store.js, so this drives the real store -- also the only way to assert the
// identity the omniscentReducer produces, which is what decides whether a
// correct store actually re-renders.
import store from "../store";
import actionTypes from "../actionTypes";

const { LINKED_VALUES_UPDATED, SET_STATE } = actionTypes;

const linkingTableId = 1;
const unrelatedTableId = 2;

const firstRowId = 10;
const secondRowId = 11;
const unrelatedRowId = 99;
const linkedRowId = 5;

// Both rows of the linking table link the same row, so both hold a copy of its
// identifier -- but only the first one is in the payload below.
const oldName = "grey";
const newName = "blue";

const seed = () =>
  store.dispatch({
    type: SET_STATE,
    state: {
      ...store.getState(),
      rows: {
        [linkingTableId]: {
          data: [
            {
              id: firstRowId,
              values: ["wheel", [{ id: linkedRowId, value: oldName }]]
            },
            {
              id: secondRowId,
              values: ["frame", [{ id: linkedRowId, value: oldName }]]
            }
          ]
        },
        [unrelatedTableId]: { data: [{ id: unrelatedRowId, values: ["none"] }] }
      },
      tableView: {
        ...store.getState().tableView,
        displayValues: {
          [linkingTableId]: [
            { id: firstRowId, values: ["wheel", [oldName]] },
            { id: secondRowId, values: ["frame", [oldName]] }
          ],
          [unrelatedTableId]: [{ id: unrelatedRowId, values: ["none"] }]
        }
      }
    }
  });

const update = updates =>
  store.dispatch({ type: LINKED_VALUES_UPDATED, updates });

// What collectLinkedValueUpdates() produces for the first row: the patched
// value, plus a new display value for the one column position that changed.
const patchedFirstRow = [
  {
    tableId: linkingTableId,
    rows: [
      {
        id: firstRowId,
        values: ["wheel", [{ id: linkedRowId, value: newName }]],
        displayValueUpdates: { 1: [newName] }
      }
    ]
  }
];

describe("LINKED_VALUES_UPDATED", () => {
  it("writes the patched values", () => {
    seed();
    update(patchedFirstRow);

    expect(store.getState().rows[linkingTableId].data[0].values[1]).toEqual([
      { id: linkedRowId, value: newName }
    ]);
  });

  // Only the positions holding a copy were recomputed, so display values are
  // merged per column index instead of replacing the row's array.
  it("merges display values per column index", () => {
    seed();
    update(patchedFirstRow);

    expect(
      store.getState().tableView.displayValues[linkingTableId][0].values
    ).toEqual(["wheel", [newName]]);
  });

  // Without a new identity the store would be correct but nothing would
  // re-render: the omniscentReducer compares slices deeply and otherwise hands
  // back the previous root.
  it("produces a new state identity", () => {
    seed();
    const before = store.getState();
    update(patchedFirstRow);

    expect(store.getState()).not.toBe(before);
  });

  it("keeps the identity of everything it did not touch", () => {
    seed();
    const before = store.getState();
    update(patchedFirstRow);
    const after = store.getState();

    // untouched table
    expect(after.rows[unrelatedTableId]).toBe(before.rows[unrelatedTableId]);
    expect(after.tableView.displayValues[unrelatedTableId]).toBe(
      before.tableView.displayValues[unrelatedTableId]
    );
    // untouched row of the touched table
    expect(after.rows[linkingTableId].data[1]).toBe(
      before.rows[linkingTableId].data[1]
    );
    expect(after.tableView.displayValues[linkingTableId][1]).toBe(
      before.tableView.displayValues[linkingTableId][1]
    );
    // the patched row itself is a new object
    expect(after.rows[linkingTableId].data[0]).not.toBe(
      before.rows[linkingTableId].data[0]
    );
  });

  it("ignores a table that is not in the store", () => {
    seed();
    const before = store.getState();
    update([
      {
        tableId: 4711,
        rows: [{ id: firstRowId, values: [], displayValueUpdates: { 0: "x" } }]
      }
    ]);

    // nothing changed, so the reducer hands back the very same root
    expect(store.getState()).toBe(before);
  });

  it("ignores a row that is not in the store", () => {
    seed();
    const before = store.getState();
    update([
      {
        tableId: linkingTableId,
        rows: [
          { id: 4711, values: ["gone"], displayValueUpdates: { 0: "gone" } }
        ]
      }
    ]);
    const after = store.getState();

    expect(after.rows[linkingTableId].data.map(row => row.id)).toEqual([
      firstRowId,
      secondRowId
    ]);
    expect(after.rows[linkingTableId].data[0]).toBe(
      before.rows[linkingTableId].data[0]
    );
  });

  it("takes an empty payload", () => {
    seed();
    const before = store.getState();
    update([]);

    expect(store.getState()).toBe(before);
  });
});
