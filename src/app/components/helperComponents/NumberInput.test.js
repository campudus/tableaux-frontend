import {
  deleteCharAt,
  getDigitPositionInString,
  insertCharAt
} from "./NumberInput";

describe("NumberInput", () => {
  describe("getDigitPositionInString()", () => {
    it("finds correct positions in formatted positive numbers", () => {
      const numberString1 = "123.456,7";
      const positions = [
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 4],
        [4, 5],
        [5, 6],
        [6, 8],
        [100, 9]
      ];
      positions.forEach(([digit, expectedPosition]) => {
        expect(getDigitPositionInString(numberString1, digit)).toBe(
          expectedPosition
        );
      });
      expect(getDigitPositionInString("0,", 1)).toBe(2);
      expect(getDigitPositionInString("0.", 1)).toBe(2);
    });

    it("finds correct positions in formatted negative numbers", () => {
      // Especially, it also reports the index of the minus sign
      const numberString1 = "-123.456,7";
      const positions = [
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 5],
        [5, 6],
        [6, 7],
        [7, 9],
        [100, 10]
      ];
      positions.forEach(([digit, expectedPosition]) => {
        expect(getDigitPositionInString(numberString1, digit)).toBe(
          expectedPosition
        );
      });
      expect(getDigitPositionInString("-0,", 2)).toBe(3);
      expect(getDigitPositionInString("-0.", 2)).toBe(3);
    });
  });

  describe("insertCharAt()", () => {
    it("inserts chars correctly", () => {
      expect(insertCharAt(0, "T", "fox")).toEqual("Tfox");
      expect(insertCharAt(1, "T", "fox")).toEqual("fTox");
      expect(insertCharAt(2, "T", "fox")).toEqual("foTx");
      expect(insertCharAt(3, "T", "fox")).toEqual("foxT");
    });

    it("deals with boundary overflows", () => {
      expect(insertCharAt(100, "T", "fox")).toEqual("foxT");
      expect(insertCharAt(-100, "T", "fox")).toEqual("fox");
    });

    it("is nil safe", () => {
      expect(insertCharAt(1, "T", null)).toBe("T");
      expect(insertCharAt(1, "T", undefined)).toBe("T");
      expect(insertCharAt(null, "T", "foo")).toBe("Tfoo");
    });
  });

  describe("deleteCharAt()", () => {
    it("deletes chars correctly", () => {
      expect(deleteCharAt(0, "fox")).toEqual("ox");
      expect(deleteCharAt(1, "fox")).toEqual("fx");
      expect(deleteCharAt(2, "fox")).toEqual("fo");
    });

    it("deals with boundary overflows", () => {
      expect(deleteCharAt(100, "fox")).toEqual("fo");
      expect(deleteCharAt(-100, "fox")).toEqual("fox");
    });

    it("is nil safe", () => {});
  });
});
