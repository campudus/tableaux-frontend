import { Table } from "@grud/devtools/types";
import { TableKind } from "../constants/TableauxConstants";
import { doto } from "./functools";

const isUnionTable = (t: Table) =>
  // TODO: update Table type in @grud/devtools with `type` key, remove type cast
  (t as Table & { type: TableKind }).type === TableKind.union;

const getOriginRowId = (row: { id: number; tableId: number }) => {
  const prefix = String(row.tableId);
  const re = new RegExp(`^${prefix}0*`);
  return doto(
    row.id,
    String,
    (s: string) => s.replace(re, ""),
    (s: string) => parseInt(s, 10)
  );
};

export default {
  getOriginRowId,
  isUnionTable
};
