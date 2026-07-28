// TODO: Keep in sync with link label spacings/font
const gapWidthInPx = 6;
const linkLabelStyle = {
  padding: "6px 8px",
  fontFammily: "Roboto",
  fontSize: "1.3rem",
  fontWeight: "normal",
  position: "absolute"
};
const outerCellPaddingInPx = 9;
const innerLinkPaddingInPx = 8;
const ellipsisWidthInPx = 8;

export const linkReservedWidth =
  2 * outerCellPaddingInPx + 2 * innerLinkPaddingInPx + ellipsisWidthInPx;

const { max } = Math;

const measureLinkWidth = displayValue => {
  const label = document.createElement("div");
  Object.keys(linkLabelStyle).forEach(
    attr => (label.style[attr] = linkLabelStyle[attr])
  );
  // taxonomy links keep their path nodes as an array; measure the joined
  // (uncollapsed) text as the conservative worst case for this link's width
  label.innerText = Array.isArray(displayValue)
    ? displayValue.join(" > ")
    : displayValue;
  const dom = document.body;
  dom.appendChild(label);
  const width = label.getBoundingClientRect().width + gapWidthInPx;
  dom.removeChild(label);

  return width;
};

export const getVisibleLinkCount = (
  values,
  fullWidth,
  n = 0,
  reservedWidth = linkReservedWidth
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
  reservedWidth = linkReservedWidth
) => {
  const availableWidth = max(0, fullWidth - reservedWidth);
  if (n >= values.length) return max(n, 1);
  const vWidth = 40 + gapWidthInPx;
  return vWidth >= availableWidth
    ? max(n, 1)
    : getVisibleAttachmentCount(values, availableWidth - vWidth, n + 1, 0);
};
