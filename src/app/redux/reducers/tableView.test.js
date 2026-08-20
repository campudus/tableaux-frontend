import { describe, expect, it } from "vitest";
// NB: importing ./tableView directly triggers a module-init cycle via store.js,
// so this drives the real store, which is also closer to production behaviour.
import store from "../store";
import actionTypes from "../actionTypes";

const { GENERATED_DISPLAY_VALUES, SET_STATE } = actionTypes;

// displayValues[tableId][rowId].values carries two different things:
//   - a table's own rows: one entry PER COLUMN
//   - linked target rows:  a single [identifier] entry
// setLinkDisplayValues merges both into the same slot via mergeArrays, which
// overwrites INDEX-WISE -- so the identifier cache always lands on index 0 of
// the target table's own column values. That is only harmless as long as it
// holds the target's identifier (column 0 is the identifier/concat column),
// which is why buildLinkDisplayValueCache must not format with the link column.
describe("tableView: displayValues merge of link identifiers vs own columns", () => {
  const ownColumns = {
    tableId: 1,
    values: [{ id: 7, values: ["Grau", "grey stuff", "42"] }]
  };
  const linkIdentifier = { tableId: 1, values: [{ id: 7, values: ["Grau"] }] };

  const reset = () =>
    store.dispatch({
      type: SET_STATE,
      state: {
        ...store.getState(),
        tableView: { ...store.getState().tableView, displayValues: {} }
      }
    });

  const generate = displayValues =>
    store.dispatch({ type: GENERATED_DISPLAY_VALUES, displayValues });

  const rowValues = () => store.getState().tableView.displayValues[1][0].values;

  it("keeps the identifier at index 0 and preserves the other columns", () => {
    reset();
    generate([ownColumns]);
    generate([linkIdentifier]);

    expect(rowValues()).toEqual(["Grau", "grey stuff", "42"]);
  });

  it("does not corrupt the identifier column when the link cache runs first", () => {
    reset();
    generate([linkIdentifier]);
    generate([ownColumns]);

    expect(rowValues()).toEqual(["Grau", "grey stuff", "42"]);
  });

  it("a formatted link label would overwrite the identifier column (guard rail)", () => {
    // If buildLinkDisplayValueCache ever formats with the link column again,
    // this is what reaches the target table's identifier column.
    reset();
    generate([ownColumns]);
    generate([{ tableId: 1, values: [{ id: 7, values: ["Grau (12%)"] }] }]);

    expect(rowValues()[0]).toBe("Grau (12%)");
    expect(rowValues()[1]).toBe("grey stuff");
  });
});
