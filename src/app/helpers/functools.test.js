import f from "lodash/fp";

import { forkJoin, replaceMoustache } from "./functools";

describe("functools", () => {
  describe("forkjoin()", () => {
    it("simple test", () => {
      expect(forkJoin(f.add, f.toUpper, f.toLower, "fOo")).toEqual("FOOfoo");
      expect(forkJoin(f.add, f.add(5), f.multiply(10), 1)).toBe(16);
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
