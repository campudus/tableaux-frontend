import { Attachment, CellValue, FolderID } from "@grud/devtools/types";

export * from "@grud/devtools/types";

export type Annotation = {
  uuid: string;
  type: string;
  value: string;
  createdAt: string; // ISOString
};

export type Row = {
  id: number;
  final?: boolean;
  archived?: boolean;
  values: CellValue["value"][];
  annotations?: Annotation[][];
};

export type TableParams = {
  tableId: string | number;
  columnId: string | number;
  rowId: string | number;
};

export type Folder = {
  id: FolderID;
  name: string;
  description: string;
  parent: number | null; // id
  parents: number[];
  createdAt: string | null;
  updatedAt: string | null;
  subfolders: Folder[];
  files: Attachment[];
};

export type ColumnAttributeString = { type: "string"; value: string };
export type ColumnAttributeNumber = { type: "number"; value: number };
export type ColumnAttributeBoolean = { type: "boolean"; value: boolean };
export type ColumnAttributeArray = { type: "array"; value: ColumnAttribute[] };
export type ColumnAttribute =
  | ColumnAttributeString
  | ColumnAttributeBoolean
  | ColumnAttributeNumber
  | ColumnAttributeArray;

export type ColumnAttributeMap = {
  [key: string]: ColumnAttribute;
};
