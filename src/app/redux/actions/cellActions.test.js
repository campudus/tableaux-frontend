import { ColumnKinds } from "../../constants/TableauxConstants";
import { getEmptyValue, isEmptyValue } from "./cellActions";

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

describe("getEmptyValue()", () => {
  test.each`
    kind                      | expected
    ${ColumnKinds.attachment} | ${[]}
    ${ColumnKinds.currency}   | ${null}
    ${ColumnKinds.date}       | ${null}
    ${ColumnKinds.datetime}   | ${null}
    ${ColumnKinds.integer}    | ${null}
    ${ColumnKinds.link}       | ${[]}
    ${ColumnKinds.numeric}    | ${null}
    ${ColumnKinds.richtext}   | ${null}
    ${ColumnKinds.shorttext}  | ${null}
    ${ColumnKinds.text}       | ${null}
  `(
    "Empty value for cell kind $kind should be $expected",
    ({ kind, expected }) => {
      expect(getEmptyValue(kind)).toEqual(expected);
    }
  );
});
