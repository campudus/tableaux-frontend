import { splitPriceDecimals } from "./currencyHelper";

describe("currencyHelper", () => {
  describe("splitPriceDecimals()", () => {
    it("is nil safe", () => {
      expect(splitPriceDecimals(null)).toEqual(["", ""]);
      expect(splitPriceDecimals(undefined)).toEqual(["", ""]);
      expect(splitPriceDecimals()).toEqual(["", ""]);
    });
    it("handles non-number values", () => {
      expect(splitPriceDecimals("test")).toEqual(["", ""]);
      expect(splitPriceDecimals({ test: "test" })).toEqual(["", ""]);
      expect(splitPriceDecimals([0, 1])).toEqual(["", ""]);
    });
    it("splits decimal values", () => {
      expect(splitPriceDecimals(2.1)).toEqual(["2", "1"]);
      expect(splitPriceDecimals(0.1)).toEqual(["0", "1"]);
      expect(splitPriceDecimals(42.69)).toEqual(["42", "69"]);
    });
    it("handles non-decimal values", () => {
      expect(splitPriceDecimals(2)).toEqual(["2", "00"]);
      expect(splitPriceDecimals(0)).toEqual(["0", "00"]);
      expect(splitPriceDecimals(42)).toEqual(["42", "00"]);
    });
  });
});
