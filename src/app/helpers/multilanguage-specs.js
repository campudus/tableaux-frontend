import { Langtags } from "../constants/TableauxConstants";
import f from "lodash/fp";

const isOptionalString = v => f.isNil || f.isString(v);

export const getLangObjSpec = f.memoize(() =>
  f.flow(
    f.map(lt => [lt, isOptionalString]),
    f.fromPairs
  )(Langtags)
);
