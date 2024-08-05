import f from "lodash/fp";
import { ColumnKinds } from "../constants/TableauxConstants";

const yearNameRegex = /year/i;

export const isYearColumn = (column = {}) => yearNameRegex.test(column.name);

// Array<Column> -> Set<ColumnID>
export const findGroupMemberIds = f.compose(
  xs => new Set(xs),
  f.map("id"),
  f.flatMap("groups"),
  f.filter(
    f.where({
      kind: f.eq(ColumnKinds.group),
      showMemberColumns: isFalsy
    })
  )
);

const isFalsy = x => !x;
