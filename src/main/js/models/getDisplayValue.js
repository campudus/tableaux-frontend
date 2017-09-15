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
  (column = {}, value) => {
    const retrieveDisplayValue = f.cond([
      [f.eq(ColumnKinds.link), f.always(getLinkValue)],
      [f.eq(ColumnKinds.concat), f.always(getConcatValue("concats"))],
      [f.eq(ColumnKinds.group), f.always(getConcatValue("groups"))],
      [f.eq(ColumnKinds.boolean), f.always(getBoolValue)],
      [f.eq(ColumnKinds.attachment), f.always(getAttachmentFileName)],
      [f.startsWith("date"), f.always(getDateValue)],
      [f.stubTrue, f.always(getDefaultValue)]
    ])(column.kind);
    return retrieveDisplayValue(column)(value);
  }
);

const merge = (coll, [key, value]) => {
  coll[key] = value;
  return coll;
};

// Helper to build a multilang object
const applyToAllLangs = fn => (
  Langtags
    .map(lt => [lt, fn(lt)])
    .reduce(merge, {})
);

// To catch cases where (obj.langtag || obj.DefaultLangtag) is falsey, but obj still has langtag keys
const isLangObj = (obj) => !f.isEmpty(f.intersection(f.keys(obj), Langtags));
// Retrieve obj[lantag] or obj[DefaultLangtag].
// If both are unset, return null if obj has language keys but not langtag or DefaultLangtag, else return obj
const getValueForLang = (obj, lt) => f.get(lt, obj) || f.get(DefaultLangtag, obj) || ((isLangObj(obj)) ? null : obj);

// Return cell.value
const getDefaultValue = (column) => (value) => (
  applyToAllLangs(lt => {
    const val = getValueForLang(value, lt) || "";
    return (f.isEmpty(val) && !f.isNumber(val)) ? "" : format(column, val);
  })
);

// bool -> column display name || ""
const getBoolValue = (column) => (value) => {
  const getValue = lt => {
    const isTrue = f.find(f.isBoolean, [...f.props([lt, DefaultLangtag], value), value, false]); // allow false
    return (isTrue && !isLangObj(isTrue)) ? column.displayName[lt] || column.displayName[DefaultLangtag] : "";
  };
  return applyToAllLangs(getValue);
};

// convert date to human-friendly format
const getDateValue = (column) => (value) => {
  const getDate = lt => {
    const date = getValueForLang(value, lt);
    const Formats = (column.kind === ColumnKinds.datetime) ? DateTimeFormats : DateFormats;
    return (f.isEmpty(date))
      ? ""
      : Moment(date, Formats.formatForServer).format(getValueForLang(column.format, lt) || Formats.formatForUser);
  };
  return applyToAllLangs(getDate);
};

const getLinkValue = (column) => (links) => f.map(
  f.flow(
    f.get("value"),
    getDisplayValue(column.toColumn)
  ),
  links
);

const getAttachmentFileName = (column) => (links) => {
  const getFileName = (lt, link) => f.flow(
    f.props([
      ["title", lt], ["externalName", lt], ["internalName", lt],
      ["title", DefaultLangtag], ["externalName", DefaultLangtag], ["internalName", DefaultLangtag]
    ]),
    f.find(f.identity),
    f.defaultTo("unnamed file")
  )(link);

  return f.map(
    link => applyToAllLangs(langtag => getFileName(langtag, link)),
    links
  );
};

// recursively concatenate string values
const getConcatValue = (selector) => (column) => value => {
  const concats = f.zip(f.get(selector, column), value);
  const displayValues = f.flatten( // flatten so link values get concatenated, too
    f.map(
      ([col, val]) => getDisplayValue(col, val),
      concats
    )
  );

  return applyToAllLangs(lt => format(column, f.map(f.get(lt), displayValues)));
};

const moustache = f.memoize(
  (n) => new RegExp(`\\{\\{${n}\\}\\}`, "g") // double-escape regex generator string to get single-escaped regex-braces
);

// Replace all moustache expressions "{{i}}" of the column's format string where i in [1,..,N], N = displayValue.length,
// with displayValue[i]
const format = f.curryN(2)(
  (column, displayValue) => {
    if (f.isEmpty(f.get("format", column))) { // no or empty format string => simple concat
      return (f.isArray(displayValue))
        ? displayValue
          .map(str => str.trim())
          .join(" ")
        : f.trim(displayValue);
    }

    const valueArray = (f.isArray(displayValue)) ? displayValue : [displayValue];
    // replace all occurences of {{n+1}} with displayValue[n]; then recur with n = n+1
    const applyFormat = function (result, dVal = valueArray, i = 1) {
      return (f.isEmpty(dVal))
        ? result
        : applyFormat(
          result.replace(moustache(i), f.trim(f.first(dVal))),
          f.tail(dVal),
          i + 1
        );
    };

    return f.trim(applyFormat(f.get("format", column)));
  }
);

const tests = {
  title: "formatting",
  tests: [
    ["is", "foo", format, [{}, "foo"]],
    ["is", "foo bar", format, [{}, ["foo", "bar"]]],
    ["is", "testVal foo", format, [{format: "testVal {{1}}"}, "foo"]],
    ["is", "foo bar baz", format, [{format: "{{1}} bar {{2}}"}, ["foo", "baz"]]],
    ["is", "1 x 2 x 3mm", format, [{format: "{{1}} x {{2}} x {{3}}mm"}, [1, 2, 3]]],
    ["is", "2 times moustaches is 2 times the fun", format, [{format: "{{1}} times {{2}} is {{1}} times the fun"}, [2, "moustaches"]]],
    ["is", "foo bar", format, [{format: ""}, ["foo", "bar"]]],
    ["not", "foo bar", format, [{format: " "}, ["foo", "bar"]]],
    ["is", "foo bar", format, [{format: ""}, [" foo", " bar    "]]],
    ["not", "foo   bar", format, [{format: ""}, ["foo ", " bar"]]]
  ]
};

export {format, tests};
export default getDisplayValue;
