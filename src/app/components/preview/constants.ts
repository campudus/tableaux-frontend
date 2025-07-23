import { Column } from "../../types/grud";

export const attributeKeys = {
  PREVIEW_TITLE: "previewTitle"
};

export function isPreviewTitle(column: Column): boolean {
  return !!column.attributes?.[attributeKeys.PREVIEW_TITLE];
}
