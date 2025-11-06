import { Table } from "@grud/devtools/types";
import { TableKind } from "../constants/TableauxConstants";

const isUnionTable = (t: Table) =>
  // TODO: update Table type in @grud/devtools with `type` key, remove type cast
  (t as Table & { type: TableKind }).type === TableKind.union;

export default {
  isUnionTable
};
