import {ColumnKinds, DateFormats, DateTimeFormats, DefaultLangtag, Langtags} from "../constants/TableauxConstants";
import * as f from "lodash/fp";
import Moment from "moment";

// (obj, obj) -> obj
//
// column: object-map with at least a "kind" field; more required for concat and link elements
// value: single value or object-map with entries of {langtag: value} where langtag in {Langtags}
//
// return value: object-map of {langtag: string} for all langtag in {Langtags}
const getDisplayValue = f.curryN(2)(
  (column, value) => {
    const retrieveDisplayValue = f.cond([
      [f.eq(ColumnKinds.link), f.always(getLinkValue)],
      [f.eq(ColumnKinds.concat), f.always(getConcatValue("concats"))],
      [f.eq(ColumnKinds.group), f.always(getConcatValue("groups"))],
      [f.eq(ColumnKinds.boolean), f.always(getBoolValue)],
      [f.startsWith("date"), f.always(getDateValue)],
      [f.stubTrue, f.always(getDefaultValue)]
    ])(column.kind);
    return retrieveDisplayValue(column)(value);
  }
);

// Helper to build a multilang object
const applyToAllLangs = fn => f.reduce(
  f.merge,
  {},
  f.map(lt => ({[lt]: fn(lt)}), Langtags)
);

// To catch cases where (obj.langtag || obj.DefaultLangtag) is falsey, but obj still has langtag keys
const isLangObj = (obj) => !f.isEmpty(f.intersection(f.keys(obj), Langtags));

// Return cell.value
const getDefaultValue = (column) => (value) => (
  applyToAllLangs(lt => {
    const val = f.find(f.identity, [...f.props([lt, DefaultLangtag], value), value]);
    return (f.isEmpty(val) || isLangObj(val)) ? "" : val;
  })
);

// bool -> column display name || ""
const getBoolValue = (column) => (value) => {
  const getValue = lt => {
    const isTrue = f.find(f.complement(f.isNil), [...f.props([lt, DefaultLangtag], value), value, false]); // allow false
    return (isTrue && !isLangObj(isTrue)) ? column.displayName[lt] || column.displayName[DefaultLangtag] : "";
  };
  return applyToAllLangs(getValue);
};

// convert date to human-friendly format
const getDateValue = (column) => (value) => {
  const getDate = lt => {
    const date = f.find(f.identity, [...f.props([lt, DefaultLangtag], value), value]);
    const Formats = (column.kind === ColumnKinds.datetime) ? DateTimeFormats : DateFormats;
    return (f.isEmpty(date) || isLangObj(date))
      ? ""
      : Moment(date, Formats.formatForServer).format(Formats.formatForUser);
  };
  return applyToAllLangs(getDate);
};

const getLinkValue = (column) => (links) => f.map(
  f.compose(
    getDisplayValue(column.toColumn),
    f.get("value")
  ),
  links
);

// recursively concatenate string values
const getConcatValue = (selector) => (column) => value => {
  const concats = f.zip(f.get(selector, column), value);
  const displayValues = f.flatten( // flatten so link values get concatenated, too
    f.map(
      ([col, val]) => getDisplayValue(col, val),
      concats
    )
  );

  return applyToAllLangs(lt => f.join(" ", f.map(f.get(lt), displayValues)));
};

export default getDisplayValue;
