import { measureText } from "./measureText";

const gapWidthInPx = 6;
const outerCellPaddingInPx = 9;
const innerLinkPaddingInPx = 8;
const ellipsisWidthInPx = 8;

export const cellReservedWidth = 2 * outerCellPaddingInPx + ellipsisWidthInPx;
export const linkReservedWidth = 2 * innerLinkPaddingInPx + gapWidthInPx;

const { max } = Math;

// taxonomy links keep their path nodes as an array; measure the joined
// (uncollapsed) text as the conservative worst case for this link's width
const measureLinkWidth = displayValue => {
  const text = Array.isArray(displayValue)
    ? displayValue.join(" > ")
    : displayValue;
  return measureText(text) + linkReservedWidth;
};

export const getVisibleLinkCount = (
  values,
  fullWidth,
  n = 0,
  reservedWidth = cellReservedWidth
) => {
  const availableWidth = max(0, fullWidth - reservedWidth);
  if (n >= values.length) return max(n, 1);
  const nextVal = values[n];
  const vWidth = measureLinkWidth(nextVal);

  return vWidth >= availableWidth
    ? max(n, 1)
    : getVisibleLinkCount(values, availableWidth - vWidth, n + 1, 0);
};

export const getVisibleAttachmentCount = (
  values,
  fullWidth,
  n = 0,
  reservedWidth = cellReservedWidth
) => {
  const availableWidth = max(0, fullWidth - reservedWidth);
  if (n >= values.length) return max(n, 1);
  const vWidth = 40 + gapWidthInPx;
  return vWidth >= availableWidth
    ? max(n, 1)
    : getVisibleAttachmentCount(values, availableWidth - vWidth, n + 1, 0);
};
