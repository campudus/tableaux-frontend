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

const getGroupColumnGroupIds = (columns: Column[] | undefined): number[] => {
  if (!columns) return [];

  const groupColumnGroupIds: number[] = [];

  columns.forEach(column => {
    if (column.kind === "group") {
      groupColumnGroupIds.push(...column.groups.map(g => g.id));
    }
  });

  return groupColumnGroupIds;
};

export const combineColumnsAndRow = (
  columns: Column[] | undefined,
  row: Row | undefined
): ColumnAndRow[] => {
  if (!columns || !row) return [];

  const groupColumnGroupIds = getGroupColumnGroupIds(columns);

  return columns
    .map((column, index) => ({
      column,
      row: {
        id: row.id,
        values: row.values[index]
      }
    }))
    .filter(
      ({ column }) =>
        column.id !== 0 && !groupColumnGroupIds.includes(column.id)
    );
};

export const combineColumnsAndRows = (
  columns: Column[] | undefined,
  rows: Row[] | undefined
): ColumnAndRows[] => {
  if (!columns || !rows) return [];

  const groupColumnGroupIds = getGroupColumnGroupIds(columns);

  return columns
    .map((column, index) => {
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
    .filter(
      ({ column }) =>
        column.id !== 0 && !groupColumnGroupIds.includes(column.id)
    );
};

export const getEmptyClassName = (value?: unknown): string => {
  if (f.isBoolean(value)) return "";

  if (!value) return "empty";

  if (Array.isArray(value) && value.length === 0) return "empty";

  return "";
};
