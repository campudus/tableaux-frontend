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
  [Mode.equals]: x => y => y === x,
  [Mode.gt]: x => y => y > x,
  [Mode.gte]: x => y => y >= x,
  [Mode.isEmpty]: () => y => typeof y !== "number" || isNaN(y),
  [Mode.isNotEmpty]: () => y => typeof y === "number" && !isNaN(y),
  [Mode.lt]: x => y => y < x,
  [Mode.lte]: x => y => y <= x
};
