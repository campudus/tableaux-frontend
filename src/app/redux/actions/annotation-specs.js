import { Langtags } from "../../constants/TableauxConstants";

import f from "lodash/fp";

import { validate } from "../../specs/type";

const knownTextAnnotations = ["info", "error", "warning"];

const isFlag = v => v === "flag";
const isString = v => f.isString(v);
const isNil = v => f.isNil(v);
const isTextAnnotationKey = v => f.contains(v, knownTextAnnotations);
const isLangtagArray = v =>
  f.isArray(v) && f.every(f.contains(f.__, Langtags), v);

const multilangAnnotationSpec = {
  type: isFlag,
  value: isString,
  langtags: isLangtagArray
};

const flagAnnotationSpec = {
  type: isFlag,
  value: isString,
  langtag: isNil
};

const textAnnotationSpec = {
  type: isTextAnnotationKey,
  value: isString,
  langtag: isNil
};

export const isMultilangAnnotation = validate(multilangAnnotationSpec);
export const isFlagAnnotation = validate(flagAnnotationSpec);
export const isTextAnnotation = validate(textAnnotationSpec);
