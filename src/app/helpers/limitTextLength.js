import f from "lodash/fp";
// export function getTextLimits(column) {
//   const { minLength, maxLength } = column
//   return { minLength, maxLength }
// }

export function columnHasMinLength(column) {
  const { minLength } = column;
  return f.isNumber(minLength);
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
  const textWithoutWhiteSpace = text.replace(/\s+/g, "");
  return textWithoutWhiteSpace;
}

export function getTextLengthWithoutWhiteSpace(text) {
  return getTextWithoutWhiteSpace(text).length;
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

export function isTextInRange(minLength, maxLength, text) {
  return isTextTooShort(minLength, text) && isTextTooLong(maxLength, text);
}
