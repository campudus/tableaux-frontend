import { describe, expect, it } from "vitest";
// NB: importing the slice reducers directly triggers a module-init cycle via
// store.js, so this drives the real store -- which is also closer to production
// behaviour.
import getDisplayValue from "../../helpers/getDisplayValue";
import actionTypes from "../actionTypes";
import store from "../store";

const {
  CELL_ROLLBACK_VALUE,
  CELL_SET_VALUE,
  COLUMNS_DATA_LOADED,
  COLUMN_EDIT_SUCCESS,
  SET_STATE
} = actionTypes;

const tableId = 1;
const rowId = 10;

const langtag = "de-DE";

// Positional in every value array below: the concat's members are [name, flag],
// so are the group's, and the row's values are [concat, name, group, flag].
const CONCAT_IDX = 0;
const GROUP_IDX = 2;
const FLAG_IDX = 3;

const nameColumn = {
  id: 11,
  name: "name",
  kind: "shorttext",
  identifier: true
};

// The column the bug is about: an identifier (so it feeds the concat) that is
// also a group member (so it feeds the group column).
const flagColumn = {
  id: 13,
  name: "active",
  kind: "boolean",
  identifier: true,
  displayName: { [langtag]: "Aktiv" }
};

const concatColumn = {
  id: 10,
  name: "ID",
  kind: "concat",
  concats: [nameColumn, flagColumn]
};

const groupColumn = {
  id: 12,
  name: "group",
  kind: "group",
  groups: [nameColumn, flagColumn]
};

// `withGroup: false` seeds a group column that does not list the flag as a
// member, so the flag is an identifier and nothing else.
const seed = ({ withGroup = true, flagIsIdentifier = true } = {}) => {
  const flag = { ...flagColumn, identifier: flagIsIdentifier };
  const columns = [
    { ...concatColumn, concats: [nameColumn, flag] },
    nameColumn,
    { ...groupColumn, groups: withGroup ? [nameColumn, flag] : [nameColumn] },
    flag
  ];

  store.dispatch({
    type: COLUMNS_DATA_LOADED,
    tableId,
    result: { columns }
  });

  store.dispatch({
    type: SET_STATE,
    state: {
      ...store.getState(),
      rows: {
        [tableId]: {
          data: [
            {
              id: rowId,
              tableId,
              values: [["Rad", false], "Rad", ["Rad", false], false]
            }
          ]
        }
      },
      tableView: {
        ...store.getState().tableView,
        displayValues: {
          [tableId]: [{ id: rowId, values: columns.map(() => ({})) }]
        }
      }
    }
  });

  return columns;
};

const setFlag = (newValue, oldValue = !newValue) =>
  store.dispatch({
    type: CELL_SET_VALUE,
    tableId,
    columnId: flagColumn.id,
    rowId,
    column: store.getState().columns[tableId].data[FLAG_IDX],
    oldValue,
    newValue
  });

const values = () => store.getState().rows[tableId].data[0].values;
const displayValues = () =>
  store.getState().tableView.displayValues[tableId][0].values;

describe("dependent concat and group values after a cell change", () => {
  it("updates the concat AND the group of an identifier that is a group member", () => {
    const columns = seed();

    setFlag(true);

    expect(values()[FLAG_IDX]).toBe(true);
    // This is the regression: the group used to win the either/or and the
    // concat at index 0 was never patched, which left the EntityView title and
    // every concat display value stale for good.
    expect(values()[CONCAT_IDX]).toEqual(["Rad", true]);
    expect(values()[GROUP_IDX]).toEqual(["Rad", true]);

    expect(displayValues()[CONCAT_IDX]).toEqual(
      getDisplayValue(columns[CONCAT_IDX], ["Rad", true])
    );
    expect(displayValues()[GROUP_IDX]).toEqual(
      getDisplayValue(columns[GROUP_IDX], ["Rad", true])
    );
    expect(displayValues()[CONCAT_IDX][langtag]).toBe("Rad Aktiv");
  });

  it("applies the update optimistically, with the cell write itself", () => {
    seed();

    // No CELL_SAVED_SUCCESSFULLY dispatched: the dependent values must already
    // be in line, like the changed cell's own display value.
    setFlag(true);

    expect(values()[CONCAT_IDX]).toEqual(["Rad", true]);
    expect(values()[GROUP_IDX]).toEqual(["Rad", true]);
  });

  it("restores concat and group on rollback", () => {
    seed();
    setFlag(true);

    store.dispatch({
      type: CELL_ROLLBACK_VALUE,
      tableId,
      columnId: flagColumn.id,
      rowId,
      column: store.getState().columns[tableId].data[FLAG_IDX],
      oldValue: false,
      newValue: true
    });

    expect(values()[FLAG_IDX]).toBe(false);
    expect(values()[CONCAT_IDX]).toEqual(["Rad", false]);
    expect(values()[GROUP_IDX]).toEqual(["Rad", false]);
    expect(displayValues()[CONCAT_IDX][langtag]).toBe("Rad");
  });

  it("updates only the concat for an identifier that is in no group", () => {
    seed({ withGroup: false });

    setFlag(true);

    expect(values()[CONCAT_IDX]).toEqual(["Rad", true]);
    expect(values()[GROUP_IDX]).toEqual(["Rad", false]);
  });

  it("updates only the group for a member that is no identifier", () => {
    seed({ flagIsIdentifier: false });

    setFlag(true);

    expect(values()[CONCAT_IDX]).toEqual(["Rad", false]);
    expect(values()[GROUP_IDX]).toEqual(["Rad", true]);
  });

  it("picks up a group definition that arrives after the first cell change", () => {
    // The member -> group lookup used to be memoized on the table id alone and
    // never invalidated, so a group created or edited mid-session stayed
    // invisible for the rest of the session.
    seed({ withGroup: false });
    setFlag(true);
    expect(values()[GROUP_IDX]).toEqual(["Rad", false]);

    store.dispatch({
      type: COLUMN_EDIT_SUCCESS,
      tableId,
      columnId: groupColumn.id,
      result: { ...groupColumn, groups: [nameColumn, flagColumn] }
    });
    setFlag(false);
    setFlag(true);

    expect(values()[GROUP_IDX]).toEqual(["Rad", true]);
  });
});
