import f from "lodash/fp";

import { forkJoin, replaceMoustache, slidingWindow } from "./functools";

describe("functools", () => {
  describe("forkjoin()", () => {
    it("simple test", () => {
      expect(forkJoin(f.add, f.toUpper, f.toLower, "fOo")).toEqual("FOOfoo");
      expect(forkJoin(f.add, f.add(5), f.multiply(10), 1)).toBe(16);
    });
  });

  describe("slidingWindow()", () => {
    it("is nil  safe", () => {
      expect(slidingWindow(2, 1, null)).toEqual([]);
      expect(slidingWindow(null, 1, [1, 2, 3])).toEqual([]);
      expect(slidingWindow(2, null, [1, 2, 3])).toEqual([]);
      expect(slidingWindow(null, null, null)).toEqual([]);
    });

    it("is type safe", () => {
      expect(slidingWindow("a", "b", "c")).toEqual([]);
      expect(slidingWindow("1", 2, [1, 2, 3])).toEqual([]);
      expect(slidingWindow(1, "2", [1, 2, 3])).toEqual([]);
    });

    it("catches erroneous inputs", () => {
      expect(slidingWindow(0, 1, [1, 2, 3])).toEqual([]);
      expect(slidingWindow(1, 0, [1, 2, 3])).toEqual([]);
      expect(slidingWindow(0, 0, [1, 2, 3])).toEqual([]);
    });

    it("creates simple windows as expected", () => {
      expect(slidingWindow(2, 1, [1, 2, 3, 4, 5])).toEqual([
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5]
      ]);
      expect(slidingWindow(3, 1, [1, 2, 3, 4, 5])).toEqual([
        [1, 2, 3],
        [2, 3, 4],
        [3, 4, 5]
      ]);
      expect(slidingWindow(3, 2, [1, 2, 3, 4, 5])).toEqual([
        [1, 2, 3],
        [3, 4, 5]
      ]);
    });

    it("can deal with undefull arrays", () => {
      expect(slidingWindow(10, 1, [1, 2, 3])).toEqual([]);
      expect(slidingWindow(2, 10, [1, 2, 3])).toEqual([[1, 2]]);
    });
  });

  describe("replaceMoustache()", () => {
    const values = {
      foo: "FOO"
    };
    it("is nil safe", () => {
      expect(replaceMoustache(null, null, null)).toBe(null);
      expect(replaceMoustache(null, null, "I am {{foo}}")).toEqual(
        "I am {{foo}}"
      );
      expect(replaceMoustache(null, "foo", "I am {{foo}}")).toEqual(
        "I am {{foo}}"
      );
      expect(replaceMoustache(values, null, "I am {{foo}}")).toEqual(
        "I am {{foo}}"
      );
      expect(replaceMoustache(values, "bar", "I am {{foo}}")).toEqual(
        "I am {{foo}}"
      );
    });

    it("replaces moustaches", () => {
      const replace = replaceMoustache(values);
      expect(replace("foo", "I am {{foo}}")).toEqual("I am FOO");
      expect(replace("foo", "I am {{foo}}{{foo}}")).toEqual("I am FOOFOO");
    });

    it("does not replace non-moustaches", () => {
      expect(replaceMoustache(values, "foo", "I am foo")).toEqual("I am foo");
      expect(replaceMoustache(values, "foo", "I am {foo}")).toEqual(
        "I am {foo}"
      );
    });
  });
});
