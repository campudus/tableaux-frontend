// TODO: Keep in sync with link label spacings/font
const gapWidthInPx = 8;
const linkLabelStyle = {
  padding: "6px 8px",
  fontFammily: "Roboto",
  fontSize: "1.3rem",
  fontWeight: "normal",
  position: "absolute"
};

const { max } = Math;

const measureLinkWidth = displayValue => {
  const label = document.createElement("div");
  Object.keys(linkLabelStyle).forEach(
    attr => (label.style[attr] = linkLabelStyle[attr])
  );
  label.innerText = displayValue;
  const dom = document.body;
  dom.appendChild(label);
  const width = label.getBoundingClientRect().width + gapWidthInPx;
  dom.removeChild(label);

  return width;
};

export const getVisibleLinkCount = (values, availableWidth, n = 0) => {
  if (n >= values.length) return max(n, 1);
  const nextVal = values[n];
  const vWidth = measureLinkWidth(nextVal);
  return vWidth >= availableWidth
    ? max(n, 1)
    : getVisibleLinkCount(values, availableWidth - vWidth, n + 1);
};
