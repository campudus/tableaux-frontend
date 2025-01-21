import { maybe } from "../helpers/functools";
import Text from "./Text";

const Mode = {
  contains: "contains",
  equals: "equals",
  gt: "gt",
  gte: "gte",
  isEmpty: "is-empty",
  isNotEmpty: "is-not-empty",
  lt: "lt",
  lte: "lte"
};

export default {
  Mode,
  readValue: str =>
    maybe(str)
      .map(parseFloat)
      .filter(isFinite)
      .getOrElse(null),
  [Mode.contains]: x => {
    const test = Text.contains(String(x));
    return y => test(String(y));
  },
  [Mode.equals]: x => y => y === x,
  [Mode.gt]: x => y => y > x,
  [Mode.gte]: x => y => y >= x,
  [Mode.isEmpty]: () => y => typeof y !== "number" || isNaN(y),
  [Mode.isNotEmpty]: () => y => typeof y === "number" && !isNaN(y),
  [Mode.lt]: x => y => y < x,
  [Mode.lte]: x => y => y <= x
};
