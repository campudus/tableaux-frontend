import {
  Attachment as _Attachment,
  CellValue,
  Column,
  FolderID,
  Locale,
  Table
} from "@grud/devtools/types";
import { UserSettingsState } from "../redux/reducers/userSettings";

export * from "@grud/devtools/types";

export type Annotation = {
  uuid: string;
  type: string;
  value: string;
  createdAt: string; // ISOString
};

export type Row = {
  id: number;
  tableId?: number;
  final?: boolean;
  cells?: Cell[];
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
  parentId: FolderID | null; // id
  parentIds: FolderID[];
  createdAt: string | null;
  updatedAt: string | null;
  parents: Folder[];
  subfolders: Folder[];
  files: Attachment[];
  permission?: {
    create: boolean;
    delete: boolean;
    edit: boolean;
  };
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
  frontendServices: Array<Record<string, unknown>>;
  grudStatus: {
    connectedToBackend: boolean;
  };
  media: Record<string, unknown>;
  multiSelect: Array<Cell>;
  overlays: { toast: unknown; overlays: Array<OverlayEntry> };
  preview: {
    currentTable: number;
    currentColumn: number | null;
    currentRow: number;
    currentDetailTable: number | null;
    selectedLinkedEntries: number[] | null;
  };
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
    filters: Array<Filter>;
    history: { undoQueue: Array<UndoEntry> };
    showArchived: string;
    sorting: { direction: "asc" | "desc"; colName: string };
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
  userSettings: UserSettingsState;
};

export type Filter = Array<string | number | Filter>;

type UndoEntry = {
  type: string;
  cell: Cell;
  column: Column;
  newValue: CellValue;
  oldValue: CellValue;
};

type OverlayEntry = {
  body: React.FC;
  columns: Array<Column>;
  head: React.FC;
  id: number;
  name: string;
  preferRight?: boolean;
  table: Table;
  title: { column: Column; table: Table; row: Row };
  type: string;
};
