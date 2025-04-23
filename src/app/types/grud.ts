import {
  Attachment,
  CellValue,
  Column,
  FolderID,
  Locale,
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

export type Cell = {
  id: string;
  row: Row;
  column: Column;
  value: CellValue;
  table: Table;
};

export type GRUDStore = {
  columns: Record<
    number,
    { data: Array<Column>; error: boolean; finishedLoading: boolean }
  >;
  frontendServices: Array<any>;
  globalSettings: {
    annotationReset: boolean;
    columnsReset: boolean;
    filterReset: boolean;
    sortingDesc: boolean;
    sortingReset: boolean;
  };
  grudStatus: {
    connectedToBackend: boolean;
  };
  media: Record<string, any>;
  multiSelect: Array<any>;
  overlays: { toast: any; overlays: Array<any> };
  rows: Record<
    number,
    {
      data: Array<Row & { cells: Array<Cell> }>;
      error: boolean;
      finishedLoading: boolean;
    }
  >;
  selectedCell: {
    cell: Cell;
    editing: boolean;
    preventCellSelection: boolean;
    selectedCell?: { rowId: number; columnId: number; langtag: Locale };
  };
  tableView: {
    annotationHightlight?: string;
    copySource?: Cell;
    currentLanguage: Locale;
    currentTable: number;
    displayValues: Record<
      number,
      Array<{ id: number; values: Array<Record<string, string>> }>
    >;
    editing: boolean;
    expandedRowIds: Array<number>;
    filters: Array<any>;
    history: Array<any>;
    showArchived: string;
    sorting: Array<any>;
    startedGeneratingDisplayValues: boolean;
    visibleColumns: Array<number>;
    visibleRows: Array<number>;
    worker: Worker;
  };
  tables: {
    data: Record<number, Table>;
    error: boolean;
    finishedLoading: boolean;
  };
};
