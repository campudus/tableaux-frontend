import f from "lodash/fp";

import { getLangObjSpec } from "../../helpers/multilanguage-specs";
import { validate } from "../../specs/type";

const knownTextAnnotations = ["info", "error", "warning"];

const langObjSpec = getLangObjSpec();
const isLangObject = v => validate(langObjSpec, v);

const isFlag = v => v === "flag";
const isString = v => f.isString(v);
const isNil = v => f.isNil(v);
const isTextAnnotationKey = v => f.contains(v, knownTextAnnotations);

const multilangAnnotationSpec = {
  type: isFlag,
  value: isString,
  langtags: isLangObject
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
