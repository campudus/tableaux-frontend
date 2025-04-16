import {
  Attachment as _Attachment,
  CellValue,
  Column,
  FolderID,
  Table
} from "@grud/devtools/types";

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

// Fix in grud-devtools
export type Attachment = _Attachment & { dependentRowCount: number };

export type Folder = {
  id: FolderID;
  name: string;
  description: string;
  parentId: number | null; // id
  parentIds: number[];
  createdAt: string | null;
  updatedAt: string | null;
  parents: Folder[];
  subfolders: Folder[];
  files: Attachment[];
};

export type FileDependentRowItem = {
  row: Row;
  toColumn: Column;
};

export type FileDependentRow = {
  table: Table;
  column: Column;
  rows: FileDependentRowItem[];
};
