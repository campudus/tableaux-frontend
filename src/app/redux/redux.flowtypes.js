// @flow

export type KeyId = string | number;
export type DependencyMap = { [TableId]: { [TableId]: [ColumnId] } };

export type Transducer<T> = T => T;
export type Reducer<T1, T2> = T1 => T2;

export type Column = {
  id: ColumnId,
  toTable: ?number,
  toTable: ?Column,
  kind: ?string,
  multilanguage: ?boolean,
  visible: ?boolean,
  ordering: ?number,
  identifier: ?boolean,
  description: ?Value<string>,
  languagetype: ?string,
  name: ?string,
  displayName: ?Value<string>
};

export type Row = { id: RowId, annotations: ?[{}] };

export type Table = { id: TableId };

export type Value<T> = T | { [Langtag]: T };
export type DisplayValue = Value<string>;

export type TableId = KeyId;
export type ColumnId = KeyId;
export type RowId = KeyId;
export type Langtag = string;

export type Cell<T> = {
  column: Column,
  row: Row,
  table: Table,
  value: ?Value<T>,
  displayValue: ?DisplayValue,
  id: ?string
};

export type ReduxDataState<T> = {
  [number]: { data: ?[T], finishedLoading: boolean, error: boolean }
};
export type ColumnDataState = ReduxDataState<Column>;
export type TableDataState = ReduxDataState<Table>;
export type RowDataState = ReduxDataState<{
  [number]: { values: [Value<any>], cells: [Cell<any>], annotations: [{}] }
}>;

export type TableViewDataState = {
  columnOrdering: [number],
  copySource: ?{},
  currentTable: number,
  displayValue: { [number]: { id: RowId, values: [{ [Langtag]: string }] } },
  editing: boolean,
  filters: [{}],
  history: [{}],
  selectedCell: ?{ columnId: number, rowId: number, langtag: string },
  sorting: {},
  visibleColumns: [number],
  visibleRows: [number],
  worker: any
};

export type ReduxTableData = {
  tables: TableDataState,
  columns: ColumnDataState,
  rows: RowDataState,
  tableView: TableViewDataState
};
