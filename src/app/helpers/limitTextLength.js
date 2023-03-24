import f from "lodash/fp";

export function columnHasMinLength(column) {
  const { minLength } = column;
  return f.isNumber(minLength) && minLength > 0;
}
export function columnHasMaxLength(column) {
  const { maxLength } = column;
  return f.isNumber(maxLength);
}

export function isTextTooShort(column, text) {
  if (!columnHasMinLength(column)) {
    return false;
  }
  const textLength = getTextLength(text);
  return textLength !== 0 && textLength < column.minLength;
}

export function getTextWithoutWhiteSpace(text) {
  return text.replace(/\s+/g, "");
}

export function getTextLengthWithoutWhiteSpace(text) {
  return getTextLength(getTextWithoutWhiteSpace(text));
}

export function getTextLength(text) {
  return f.size(text);
}

export function isTextTooLong(column, text) {
  if (!columnHasMaxLength(column)) {
    return false;
  }
  return getTextLength(text) > column.maxLength;
}
