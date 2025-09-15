/* eslint-disable @typescript-eslint/no-explicit-any */
import { Column } from "../../types/grud";
import f from "lodash/fp";

type Row = {
  id: number;
  values: any | any[];
};

export type ColumnAndRow = {
  column: Column;
  row: Row;
};

export type ColumnAndRows = {
  column: Column;
  rows: Row[];
};

export function combineColumnsAndRow(
  columns: Column[] | undefined,
  row: Row | undefined
): ColumnAndRow[] {
  if (!columns || !row) return [];

  return columns
    ?.map((column, index) => ({
      column,
      row: {
        id: row.id,
        values: row.values[index]
      }
    }))
    .filter(({ column }) => column.id !== 0);
}

export function combinedColumnsAndRows(
  columns: Column[] | undefined,
  rows: Row[] | undefined
): ColumnAndRows[] {
  if (!columns || !rows) return [];

  return columns
    ?.map((column, index) => {
      return {
        column,
        rows: rows?.map(row => {
          return {
            id: row.id,
            values: row.values[index]
          };
        })
      };
    })
    .filter(({ column }) => column.id !== 0);
}

export function getEmptyClassName(value?: unknown): string {
  if (f.isBoolean(value)) return "";

  if (!value) return "empty";

  if (Array.isArray(value) && value.length === 0) return "empty";

  return "";
}
