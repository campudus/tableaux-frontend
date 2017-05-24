import {ColumnKinds, FallbackLanguage, Langtags} from "../constants/TableauxConstants";
import * as f from "lodash/fp";
import {fspy} from "../helpers/monads";

const getDisplayValue = (column, cell) => (value) => {
  const mkDisplayValue = f.cond([
    [f.eq(ColumnKinds.link), f.always(mkLinkValue)],
    [f.stubTrue, f.always(mkDefaultValue)]
  ])(column.kind);
  return mkDisplayValue(column, cell)(value);
};

const mkDefaultValue = (column) => (value) => f.reduce(
  f.merge, {},
  f.map(
    lt => ({[lt]: value[lt] || value[FallbackLanguage] || value}),
    Langtags
  )
);

const mkLinkValue = (column, cell) => f.map(
  f.compose(
    mkDefaultValue(column.toColumn),
    f.get("value")
  )
);

export default getDisplayValue;
