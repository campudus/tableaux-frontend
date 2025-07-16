/* eslint-disable @typescript-eslint/no-explicit-any */
import { Column, Row } from "../../types/grud";

export function filterOutIdColumn<T extends Row[] | Row | undefined>(
  columns: Column[] | undefined,
  rows: T
): {
  filteredColumns: Column[];
  filteredRows: T extends Row[] ? Row[] : T extends Row ? Row : undefined;
} {
  if (!columns || !rows) {
    return {
      filteredColumns: [],
      filteredRows: (Array.isArray(rows) ? [] : undefined) as any
    };
  }

  const hasIdColumn = columns.some(column => column.id === 0);

  if (!hasIdColumn) {
    return { filteredColumns: columns, filteredRows: rows as any };
  }

  const filteredColumns = columns.filter(column => column.id !== 0);

  if (Array.isArray(rows)) {
    return {
      filteredColumns,
      filteredRows: rows.map(row => ({
        ...row,
        values: row.values.filter((_, index) => index !== 0)
      })) as any
    };
  }

  return {
    filteredColumns,
    filteredRows: {
      ...rows,
      values: rows.values.filter((_, index) => index !== 0)
    } as any
  };
}

export function setEmptyClassName(value: any): string {
  return value ? "" : "empty";
}
