import { prepareWithSegments, measureNaturalWidth } from "@chenglou/pretext";

// Must stay in sync with the .link-label / .label-text font styling in link.scss
export const LINK_LABEL_FONT = "13px Roboto";

// Unlike DOM-based measurement (e.g. via innerText), pretext throws on
// non-string input instead of coercing it, so default missing text to "".
export const measureText = (text = "", font = LINK_LABEL_FONT) =>
  measureNaturalWidth(prepareWithSegments(text, font));
