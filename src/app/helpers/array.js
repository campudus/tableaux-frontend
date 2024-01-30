import { curryN } from "lodash/fp";

const chunkWeighted = (chunkSize, getWeight, xs) => {
  const accumulated = (xs ?? []).reduce(
    (acc, x) => {
      const w = getWeight(x);
      if (w + acc.chunkWeight <= chunkSize || acc.chunk.length === 0) {
        acc.chunk.push(x);
        acc.chunkWeight += w;
      }

      if (acc.chunkWeight >= chunkSize) {
        acc.all.push(acc.chunk);
        acc.chunk = [];
        acc.chunkWeight = 0;
      }
      return acc;
    },
    {
      all: [],
      chunk: [],
      chunkWeight: 0
    }
  );

  if (accumulated.chunk.length > 0) accumulated.all.push(accumulated.chunk);
  return accumulated.all;
};

export default { chunkWeighted: curryN(3, chunkWeighted) };
