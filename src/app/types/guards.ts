import { Attachment, Column } from "./grud";
import { RowIdColumn } from "../constants/TableauxConstants";
import f from "lodash/fp";

export * from "@grud/devtools/predicates";

export const isRowIdColumn = (column: Column): column is typeof RowIdColumn =>
  column.id === -1 && column.name === "rowId";

export const isAttachment = (value?: unknown): value is Attachment =>
  f.isPlainObject(value) && f.has("uuid", value) && f.has("mimeType", value);
