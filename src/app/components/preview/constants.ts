import { Column } from "../../types/grud";
import { ColumnAndRow } from "./helper";

export const attributeKeys = {
  PREVIEW_TITLE: "previewTitle",
  PREVIEW_DEFAULT_SELECTED: "previewDefaultSelected"
};

export function isPreviewTitle(column: Column): boolean {
  return !!column.attributes?.[attributeKeys.PREVIEW_TITLE];
}

export function isValidPreviewColumn(column: Column): boolean {
  return column.kind === "link" || column.kind === "richtext";
}

export function getDefaultSelectedColumnId(
  columnsAndRow: ColumnAndRow[]
): number | undefined {
  const columnSetAsDefaultSelected = columnsAndRow.find(
    ({ column }) => column.attributes?.[attributeKeys.PREVIEW_DEFAULT_SELECTED]
  )?.column;

  if (columnSetAsDefaultSelected) {
    return columnSetAsDefaultSelected.id;
  }

  const validPreviewDetailColumn = columnsAndRow.find(
    ({ column }) => isValidPreviewColumn(column) && !isPreviewTitle(column)
  )?.column;

  if (validPreviewDetailColumn) {
    return validPreviewDetailColumn.id;
  }

  return undefined;
}
