import { isValidDate } from "./date";
import Moment from "moment";

describe("isValidDate()", () => {
  test.each`
    x                             | expected
    ${null}                       | ${false}
    ${undefined}                  | ${false}
    ${"2001-01-01"}               | ${true}
    ${new Date()}                 | ${true}
    ${Moment()}                   | ${true}
    ${new Date("invalid string")} | ${false}
  `("isValidDate $x = $expected", ({ x, expected }) => {
    expect(isValidDate(x)).toEqual(expected);
  });
});
