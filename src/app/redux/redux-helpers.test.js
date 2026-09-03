import {
  getGroupColumnIds,
  getGroupLookup,
  idsToIndices,
  isGroupMember,
  tableColumnKey
} from "./redux-helpers";

import f from "lodash/fp";

import completeState from "./__fixtures/state.json";

const tableId = f.first(f.keys(completeState.columns));
const columns = completeState.columns[tableId].data;

describe("Redux helpers", () => {
  describe("idsToIndices()", () => {
    it("is nil safe", () => {
      const notFound = [-1, -1, -1];
      expect(idsToIndices()).toEqual(notFound);
      expect(idsToIndices({ tableId })).toEqual(notFound);
      expect(idsToIndices({ tableId: -1 })).toEqual(notFound);
      expect(idsToIndices({ tableId, rowId: -1 })).toEqual(notFound);
      expect(idsToIndices({ tableId, columnId: -1 })).toEqual(notFound);
      expect(idsToIndices({ tableId, columnId: -1, rowId: -1 })).toEqual(
        notFound
      );
      expect(idsToIndices({ tableId: -1, columnId: -1, rowId: -1 })).toEqual(
        notFound
      );
    });
  });

  describe("tableColumnKey()", () => {
    it("calculates proper keys", () => {
      expect(tableColumnKey({ tableId: 27, column: { id: 12 } })).toEqual(
        "27-12"
      );
    });
    it("is nil safe", () => {
      expect(() => tableColumnKey()).not.toThrow();
      expect(() => tableColumnKey(null)).not.toThrow();
      expect(() => tableColumnKey({})).not.toThrow();
      expect(tableColumnKey()).toBe(null);
      expect(tableColumnKey(null)).toBe(null);
      expect(tableColumnKey({})).toBe(null);
    });
  });

  describe("isGroupMember()", () => {
    it("retrieves columns' membership status correctly", () => {
      const checkMember = columnIdx =>
        isGroupMember({ tableId, column: columns[columnIdx], completeState });
      expect(checkMember(0)).toBe(false);
      expect(checkMember(4)).toBe(true);
      expect(checkMember(9)).toBe(false);

      expect(
        columns.map(column => isGroupMember({ tableId, column, completeState }))
      ).toMatchSnapshot();
    });
  });

  describe("getGroupLookup()", () => {
    it("creates correct lookup maps", () => {
      expect(getGroupLookup(columns)).toMatchSnapshot();
    });

    it("lists every group a column is a member of", () => {
      const twoGroups = [
        { id: 1, kind: "group", groups: [{ id: 3 }] },
        { id: 2, kind: "group", groups: [{ id: 3 }, { id: 4 }] },
        { id: 3, kind: "boolean" },
        { id: 4, kind: "shorttext" }
      ];
      expect(getGroupLookup(twoGroups)).toEqual({ 3: [1, 2], 4: [2] });
    });

    it("rebuilds when a table's columns change", () => {
      const withoutGroup = [{ id: 1, kind: "group" }, { id: 3 }];
      const withGroup = [
        { id: 1, kind: "group", groups: [{ id: 3 }] },
        { id: 3 }
      ];
      expect(getGroupLookup(withoutGroup)).toEqual({});
      expect(getGroupLookup(withGroup)).toEqual({ 3: [1] });
    });
  });

  describe("getGroupColumnIds()", () => {
    it("identifies group member's group columns correctly", () => {
      const findGroups = column =>
        getGroupColumnIds({ tableId, column }, completeState);
      expect(findGroups(columns[0])).toEqual([]);
      expect(findGroups(columns[4])).toEqual([31]);
      expect(findGroups(columns[9])).toEqual([]);
      expect(findGroups(columns[15])).toEqual([25]);
      expect(columns.map(findGroups)).toMatchSnapshot();
    });
  });
});
