/* eslint-disable @typescript-eslint/no-explicit-any */
import getDisplayValue from "../../helpers/getDisplayValue";
import { Column } from "../../types/grud";
import f from "lodash/fp";
import apiUrl from "../../helpers/apiUrl";
import { getColumnDisplayName } from "../../helpers/multiLanguage";
import { PreviewDefaultTitle } from "./PreviewTitle";
import { getConcatOrigin } from "../../helpers/columnHelper";

type Row = {
  id: number;
  values: any | any[];
  tableId?: number;
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
        values: row.values[index],
        tableId: row.tableId
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
  const idColumn = columns?.find(c => c.id === 0 && c.name === "ID");

  if (!idColumn) {
    return undefined;
  }

  const column = getConcatOrigin(tableId, idColumn, row?.tableId) || idColumn;
  return {
    value: getDisplayValue(column)(row?.values.at(0))[langtag],
    link: apiUrl({
      langtag,
      tableId,
      rowId: rowId
    }),
    columnDisplayName: getColumnDisplayName(column, langtag)
  };
};

export const getColumnsWithDifferences = (
  columnsAndRows: ColumnAndRows[],
  langtag: string
): ColumnAndRows[] => {
  return columnsAndRows.filter(({ column, rows }) => {
    const firstValue = getDisplayValue(column)(rows[0]?.values);
    const firstDisplay = Array.isArray(firstValue)
      ? firstValue.map(v => v[langtag]).join(", ")
      : firstValue[langtag];

    const hasDifference = rows.some(row => {
      const value = getDisplayValue(column)(row.values);
      const display = Array.isArray(value)
        ? value.map(v => v[langtag]).join(", ")
        : value[langtag];

      return display !== firstDisplay;
    });

    return hasDifference;
  });
};

export const getEmptyClassName = (value?: unknown): string => {
  if (f.isBoolean(value)) return "";

  if (!value) return "empty";

  if (Array.isArray(value) && value.length === 0) return "empty";

  return "";
};
