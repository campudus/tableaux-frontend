import f from "lodash/fp";

const Mode = {
  isSet: "is-set",
  isUnset: "is-unset",
  equals: "equals"
};

export default {
  Mode,
  [Mode.isSet]: (propPath, _) => row => Boolean(f.prop(propPath, row)),
  [Mode.isUnset]: (propPath, _) => row => {
    const value = f.prop(propPath, row);
    return f.isNil(value) || value === false;
  },
  [Mode.equals]: f.propEq
};
