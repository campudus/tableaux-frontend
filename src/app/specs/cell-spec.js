import f from "lodash/fp";
import { check, validate } from "./type";
import { ColumnKinds } from "../constants/TableauxConstants";

const containsRowValues = candidate => f.isArray(candidate);
const optionallyContainsRowAnnotations = v =>
  f.anyPass([f.isArray, f.isNil])(v);

const isInteger = v => f.isInteger(v);
const isString = v => f.isString(v);

// TODO: Change after merge with Thimo's branch
const rowSpec = {
  id: isInteger,
  values: containsRowValues,
  annotations: optionallyContainsRowAnnotations
};

const isRow = v => validate(rowSpec, v);
const isRowList = v => f.every(validate(rowSpec), v);

const isColumnKind = v => f.contains(v, ColumnKinds);

const columnSpec = {
  id: isInteger,
  ordering: isInteger,
  name: isString,
  kind: isColumnKind
};

const isColumn = v => validate(columnSpec, v);
const isColumnList = v => f.every(validate(columnSpec), v);

const cellSpec = {
  column: check(columnSpec),
  row: check(rowSpec)
};

const isCell = v => validate(cellSpec, v);

const isStringOrStringArray = v =>
  f.isString(v) || (f.isArray(v) && f.every(isString, v));
const displayValueSpec = f.flow(
  f.map(lt => [lt, isStringOrStringArray]),
  f.fromPairs
);

const isDisplayValue = v => validate(displayValueSpec, v);

export {
  columnSpec,
  rowSpec,
  cellSpec,
  displayValueSpec,
  isColumn,
  isColumnList,
  isRow,
  isRowList,
  isCell,
  isDisplayValue
};
