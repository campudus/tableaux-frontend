const Mode = {
  isSet: "is-set",
  isUnset: "is-unset"
};

export default {
  Mode,
  [Mode.isSet]: () => x => Boolean(x),
  [Mode.isUnset]: () => x => !x
};
