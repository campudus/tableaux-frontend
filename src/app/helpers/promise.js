import { curryN, chunk } from "lodash/fp";
import A from "./array";

const runChunks = async (toPromise, chunks) => {
  const results = [];
  for (const c of chunks ?? []) {
    const resolved = await Promise.all(c.map(toPromise));
    resolved.forEach(result => results.push(result));
  }
  return results;
};

const chunkPromises = async (chunkSize, toPromise, xs) =>
  runChunks(toPromise, chunk(chunkSize, xs));

const chunkPromisesWeighted = (chunkSize, toWeight, toPromise, xs) =>
  runChunks(toPromise, A.chunkWeighted(chunkSize, toWeight, xs));

const sequentialize = async (toPromise, xs) => {
  const results = [];
  for (const x of xs ?? []) {
    results.push(await toPromise(x));
  }
  return results;
};

export default {
  chunk: curryN(3, chunkPromises),
  chunkWeighted: curryN(4, chunkPromisesWeighted),
  sequentialize: curryN(2, sequentialize)
};
