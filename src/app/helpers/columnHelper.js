import f from "lodash/fp";
import { ColumnKinds } from "../constants/TableauxConstants";
import T from "./table";

const yearNameRegex = /year/i;

export const isYearColumn = (column = {}) => yearNameRegex.test(column.name);

// Array<Column> -> Set<ColumnID>
export const findGroupMemberIds = f.compose(
  xs => new Set(xs),
  f.map("id"),
  f.flatMap("groups"),
  f.filter(
    column => column.kind === ColumnKinds.group && !column.showMemberColumns
  )
);

const numericColumns = [ColumnKinds.numeric, ColumnKinds.integer];
export const getDecimalDigits = column => {
  if (!numericColumns.includes(column.kind)) {
    throw new Error(
      `Column #${column.id} "${column.name}" has no numeric value, it's of kind ${column.kind}`
    );
  }

  const { kind, decimalDigits } = column;

  switch (true) {
    case kind === ColumnKinds.integer:
      return 0;
    case typeof decimalDigits === "number" && decimalDigits >= 0:
      return decimalDigits;
    default:
      return 3;
  }
};

export const buildOriginColumnLookup = (table, columns) => {
  const toColumnMap = f.compose(
    f.mapValues("column"),
    f.indexBy("tableId"),
    f.prop("originColumns")
  );
  const originColumnLookup = T.isUnionTable(table)
    ? f.compose(f.mapValues(toColumnMap), f.indexBy("id"))(columns)
    : null;
  return (columnId, originTableId) =>
    f.prop([columnId, originTableId], originColumnLookup);
};
