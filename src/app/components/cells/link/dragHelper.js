const isNumber = x => typeof x === "number" && !isNaN(x);
const isGoodIndexOf = (coll, x) => isNumber(x) && x >= 0 && x < coll.length;

export const dragReorder = (origIdx, destIdx, coll) => {
  if (isGoodIndexOf(coll, origIdx) && isGoodIndexOf(coll, destIdx)) {
    const without = [...coll.slice(0, origIdx), ...coll.slice(origIdx + 1)];
    const prefix = without.slice(0, destIdx);
    const suffix = without.slice(destIdx);
    return [...prefix, coll[origIdx], ...suffix];
  } else {
    return coll;
  }
};
