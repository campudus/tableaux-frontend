import {
  getGroupColumn,
  getLookupMap,
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

  describe("getLookupMap()", () => {
    it("creates correct lookup maps", () => {
      expect(getLookupMap({ tableId, completeState })).toMatchSnapshot();
    });
  });

  describe("geGroupColumn()", () => {
    it("identifies group member's group column correctly", () => {
      const findGroup = column =>
        getGroupColumn({ tableId, column, completeState });
      expect(findGroup(columns[0])).toBe(null);
      expect(findGroup(columns[4])).toBe(31);
      expect(findGroup(columns[9])).toBe(null);
      expect(findGroup(columns[15])).toBe(25);
      expect(columns.map(findGroup)).toMatchSnapshot();
    });
  });
});
