import {
  Attachment as _Attachment,
  CellValue,
  Column as _Column,
  Table as _Table
} from "grud-devtools/types";

// upgrade prettier to v2 for support of new ts syntax
// export type { Attachment, Column, Table };
export type Attachment = _Attachment;
export type Column = _Column;
export type Table = _Table;

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
