import m from "moment";

const Mode = {
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
  readValue: x => x,

  [Mode.equals]: x => {
    const mX = m(x);
    return y => mX.isSame(m(y));
  },
  [Mode.gt]: x => {
    const mX = m(x);
    return y => m(y).isAfter(mX);
  },
  [Mode.gte]: x => {
    const mX = m(x);
    return y => m(y).isSameOrAfter(mX);
  },
  [Mode.isEmpty]: () => x => !m(x).isValid(),
  [Mode.isNotEmpty]: () => x => m(x).isValid(),
  [Mode.lt]: x => {
    const mX = m(x);
    return y => {
      console.log(y, "is before", x, m(y).isBefore(mX));
      return m(y).isBefore(mX);
    };
  },
  [Mode.lte]: x => {
    const mX = m(x);
    return y => m(y).isSameOrBefore(mX);
  }
};
