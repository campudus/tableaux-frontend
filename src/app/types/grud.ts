import {
  Attachment as _Attachment,
  CellValue,
  MultilangValue as _MultilangValue,
  Column as _Column,
  Table as _Table,
  LinkColumn as _LinkColumn,
  ColumnID as _ColumnID
} from "grud-devtools/types";

export const ColumnID = _ColumnID;

// upgrade prettier to v2 for support of new ts syntax
// export type { Attachment, Column, Table };
export type MultilangValue<T> = _MultilangValue<T>;
export type Attachment = _Attachment;
export type Column = _Column;
export type Table = _Table;
export type LinkColumn = _LinkColumn;

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
