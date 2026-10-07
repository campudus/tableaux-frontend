import { Table, TABLE_TYPE } from "@campudus/grud-sdk/types";
import { doto } from "./functools";

const isUnionTable = (table: Table) => table.type === TABLE_TYPE.union;

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
