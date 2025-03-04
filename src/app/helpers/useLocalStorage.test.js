import { describe, expect, it } from "vitest";
import {
  matchSafetyPrefix,
  readValue,
  safetyPrefix,
  toWriteable
} from "./useLocalStorage";

describe("useLocalStorage.js", () => {
  describe("safetyPrefixedStrings", () => {
    describe("toWriteable()", () => {
      it("is nil safe", () => {
        expect(toWriteable()(null)).toMatch(/./); // toBeInstanceOf(String) fails for strings...
        expect(toWriteable()(undefined)).toMatch(/./);
        expect(toWriteable(true)(null)).toBe(null);
        expect(toWriteable(true)(undefined)).toBe(undefined);
      });

      it("prefixes items with XSS protection strings", () => {
        expect(toWriteable()([1, 2, 3])).toMatch(matchSafetyPrefix);
      });

      it("omits prefix in raw mode", () => {
        expect(toWriteable("raw")([1, 2, 3])).toBeInstanceOf(Array);
      });
    });

    describe("readValue", () => {
      it("ignores prefix in raw mode", () => {
        const expectEqual = value =>
          expect(readValue("raw")(value)).toEqual(value);
        expectEqual("foo");
        expectEqual(safetyPrefix);
        expectEqual(safetyPrefix + "foobar");
        expectEqual({ foo: 1 });
      });

      it("removes Prefix in JSON mode", () => {
        expect(readValue()(safetyPrefix + JSON.stringify("foo"))).toEqual(
          "foo"
        );
      });
    });

    describe("integration", () => {
      it("is perfectly invertable", () => {
        const expectInvertable = (value, raw = false) => {
          const valueType = typeof value;
          const afterRoundTrip = readValue(raw)(toWriteable(raw)(value));
          expect(typeof afterRoundTrip).toEqual(valueType);
          expect(afterRoundTrip).toEqual(value);
        };

        expectInvertable("foo", "raw");
        expectInvertable("foo");
        expectInvertable({ foo: 1, bar: { baz: 2 } });
        expectInvertable(1);
        expectInvertable([1, 2, 3]);
        expectInvertable({
          foo: [1, 2, 3],
          bar: { baz: ["monty", "python's", "flying", "circus"] }
        });
      });
    });
  });
});
