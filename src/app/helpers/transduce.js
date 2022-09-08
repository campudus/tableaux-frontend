/*
 * Transducers are functions that provide a way for chaining actions on sequential
 * data with high performance by not building new sequences for intermediate steps.
 */

import f from "lodash/fp";

export const map = fn => reducer => (coll, next) => reducer(coll, fn(next));

export const filter = p => reducer => (coll, next) =>
  p(next) ? reducer(coll, next) : coll;

export const reject = p => reducer => (coll, next) =>
  p(next) ? coll : reducer(coll, next);

export const uniqBy = fn => {
  const knowns = new Set();
  return reducer => (coll, next) => {
    const key = fn(next);
    if (knowns.has(key)) return coll;
    else {
      knowns.add(key);
      return reducer(coll, next);
    }
  };
};

const conjListM = (coll, next) => {
  coll.push(next);
  return coll;
};

export const transduceList = (...fs) => list => {
  const xform = f.compose(...fs);

  return f.reduce(xform(conjListM), [], list);
};
