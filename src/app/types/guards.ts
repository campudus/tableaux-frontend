import { Column } from "./grud";
import { RowIdColumn } from "../constants/TableauxConstants";

export * from "@grud/devtools/predicates";

export const isRowIdColumn = (column: Column): column is typeof RowIdColumn =>
  column.id === -1 && column.name === "rowId";
