import { ColumnKinds } from "../../constants/TableauxConstants";
import { isEmptyValue } from "./cellActions";

describe("isEmptyValue()", () => {
  describe("date", () => {
    test.each`
      x               | expected
      ${"2024-01-26"} | ${false}
      ${null}         | ${true}
    `("isEmptyValue $x = $expected", ({ x, expected }) => {
      expect(isEmptyValue(ColumnKinds.date, x)).toBe(expected);
    });
  });
  describe("datetime", () => {
    test.each`
      x                     | expected
      ${"2024-01-26T00:00"} | ${false}
      ${null}               | ${true}
    `("isEmptyValue $x = $expected", ({ x, expected }) => {
      expect(isEmptyValue(ColumnKinds.datetime, x)).toBe(expected);
    });
  });
});
