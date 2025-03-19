import {
  Attachment,
  CellValue,
  CellValueForColumn,
  Column,
  ISODateString,
  LinkColumn,
  MultilangValue,
  MultilangCellValue,
  SingleLangCellValue,
  Table
} from "grud-devtools/types";

export type {
  Attachment,
  CellValue,
  CellValueForColumn,
  Column,
  ISODateString,
  LinkColumn,
  MultilangValue,
  MultilangCellValue,
  SingleLangCellValue,
  Table,
};

export type RowValue = CellValue["value"];

export type Row = {
  id: number;
  final: string;
  values: RowValue[];
};