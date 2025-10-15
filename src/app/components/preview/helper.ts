/* eslint-disable @typescript-eslint/no-explicit-any */
import getDisplayValue from "../../helpers/getDisplayValue";
import { Column } from "../../types/grud";
import f from "lodash/fp";
import apiUrl from "../../helpers/apiUrl";
import { getColumnDisplayName } from "../../helpers/multiLanguage";
import { PreviewDefaultTitle } from "./PreviewTitle";

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

export const getPreviewDefaultTitle = (
  langtag: string,
  tableId: number,
  rowId: number,
  columns: Column[] | undefined,
  row: Row | undefined
): PreviewDefaultTitle | undefined => {
  return columns?.some(c => c.id === 0 && c.name === "ID")
    ? {
        value: getDisplayValue(columns.at(0))(row?.values.at(0))[langtag],
        link: apiUrl({
          langtag,
          tableId,
          rowId: rowId
        }),
        columnDisplayName: getColumnDisplayName(columns.at(0), langtag)
      }
    : undefined;
};

export const getEmptyClassName = (value?: unknown): string => {
  if (f.isBoolean(value)) return "";

  if (!value) return "empty";

  if (Array.isArray(value) && value.length === 0) return "empty";

  return "";
};
