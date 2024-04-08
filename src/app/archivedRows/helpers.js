// eslint-dsable-next-line
import { flip, memoize } from "lodash";

// eslint-disable-next-line
const memoizeWith = flip(memoize);

export const isRowArchived = memoizeWith(
  row => row.id,
  () => Math.random() < 0.5
); // TODO: implement once we decided on the data type

export const isLinkArchived = _ => Math.random() < 0.5; // TODO: implement once we decided on the data type
