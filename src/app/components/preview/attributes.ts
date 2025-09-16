import f from "lodash/fp";
import { Column, ColumnKind } from "../../types/grud";
import { ColumnAndRow, ColumnAndRows } from "./helper";

export const attributeKeys = {
  PREVIEW_TITLE: "previewTitle",
  PREVIEW_DEFAULT_SELECTED: "previewDefaultSelected",
  PREVIEW_DETAIL_VIEW_IMAGE: "previewDetailViewImage",
  PREVIEW_DETAIL_VIEW_STICKY_COLUMN: "previewDetailViewStickyColumn"
};

const invalidPreviewTitleColumnKinds: ColumnKind[] = [
  "boolean",
  "currency",
  "attachment"
];

export function isPreviewTitle(column: Column): boolean {
  return (
    !!column.attributes?.[attributeKeys.PREVIEW_TITLE] &&
    !invalidPreviewTitleColumnKinds.includes(column.kind)
  );
}

export function isPreviewImage(column: Column): boolean {
  return (
    column.kind === "attachment" &&
    column.attributes?.[attributeKeys.PREVIEW_DETAIL_VIEW_IMAGE]?.value === true
  );
}

export function isStickyColumn(column: Column): boolean {
  return !!column.attributes?.[attributeKeys.PREVIEW_DETAIL_VIEW_STICKY_COLUMN];
}

export function sortColumnsAndRows(
  columnsAndRows: ColumnAndRows[]
): ColumnAndRows[] {
  const sortedColumnsAndRows = f.sortBy(
    (item: ColumnAndRows) =>
      item.column.attributes?.[attributeKeys.PREVIEW_DETAIL_VIEW_STICKY_COLUMN]
        ?.value,
    columnsAndRows
  );

  return sortedColumnsAndRows;
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

  return validPreviewDetailColumn?.id;
}
