import f from "lodash/fp";

const Mode = {
  isSet: "is-set",
  isUnset: "is-unset",
  equals: "equals",
  gt: "gt",
  lt: "lt",
  gte: "gte",
  lte: "lte",
  isEmpty: "is-empty",
  isNotEmpty: "is-not-empty"
};

export default {
  Mode,
  [Mode.isSet]: (propPath, _) => row => Boolean(f.prop(propPath, row)),
  [Mode.isUnset]: (propPath, _) => row => {
    const value = f.prop(propPath, row);
    return f.isNil(value) || value === false;
  },
  [Mode.equals]: f.propEq,
  [Mode.gt]: (propPath, x) => row => f.prop(propPath, row) > x,
  [Mode.gte]: (propPath, x) => row => f.prop(propPath, row) >= x,
  [Mode.lt]: (propPath, x) => row => f.prop(propPath, row) < x,
  [Mode.lte]: (propPath, x) => row => f.prop(propPath, row) <= x,
  [Mode.isEmpty]: (propPath, _) => row => f.isEmpty(f.prop(propPath, row)),
  [Mode.isNotEmpty]: (propPath, _) => row => !f.isEmpty(f.prop(propPath, row))
};
