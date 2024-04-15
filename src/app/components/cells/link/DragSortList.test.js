import { dragReorder } from "./dragHelper";

describe("dragReorder()", () => {
  const arr = [0, 1, 2, 3, 4, 5];
  it("should not change the list when no reordering happens", () => {
    expect(dragReorder(0, 0, arr)).toEqual(arr);
    expect(dragReorder(1, 1, arr)).toEqual(arr);
    expect(dragReorder(2, 2, arr)).toEqual(arr);
    expect(dragReorder(3, 3, arr)).toEqual(arr);
    expect(dragReorder(4, 4, arr)).toEqual(arr);
    expect(dragReorder(5, 5, arr)).toEqual(arr);
    expect(dragReorder(null, 1, arr)).toEqual(arr);
    expect(dragReorder(1, null, arr)).toEqual(arr);
  });
  it("should correctly swap items forward", () => {
    expect(dragReorder(0, 1, arr)).toEqual([1, 0, 2, 3, 4, 5]);
    expect(dragReorder(0, 2, arr)).toEqual([1, 2, 0, 3, 4, 5]);
    expect(dragReorder(3, 5, arr)).toEqual([0, 1, 2, 4, 5, 3]);
    expect(dragReorder(1, 4, arr)).toEqual([0, 2, 3, 4, 1, 5]);
  });
  it("should correctly swap items backward", () => {
    expect(dragReorder(5, 4, arr)).toEqual([0, 1, 2, 3, 5, 4]);
    expect(dragReorder(5, 3, arr)).toEqual([0, 1, 2, 5, 3, 4]);
    expect(dragReorder(3, 0, arr)).toEqual([3, 0, 1, 2, 4, 5]);
    expect(dragReorder(3, 1, arr)).toEqual([0, 3, 1, 2, 4, 5]);
  });
  it("should handle empty arrays", () => {
    expect(dragReorder(1, 2, [])).toEqual([]);
  });
  it("should handle singletons", () => {
    expect(dragReorder(1, 2, [1])).toEqual([1]);
  });
  it("should handle overflowing indices", () => {
    const coll = [0, 1];
    expect(dragReorder(1, 2, coll)).toEqual(coll);
    expect(dragReorder(-1, 0, coll)).toEqual(coll);
  });
});
