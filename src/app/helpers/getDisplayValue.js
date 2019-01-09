import {
  ColumnKinds,
  DateFormats,
  DateTimeFormats,
  DefaultLangtag,
  Langtags
} from "../constants/TableauxConstants";
import * as f from "lodash/fp";
import Moment from "moment";
import {getCountryOfLangtag, getCurrencyCode} from "./multiLanguage";
import {getCurrencyWithCountry} from "../components/cells/currency/currencyHelper";

// (obj, obj) -> obj
//
// column: object-map with at least a "kind" field; more required for concat and link elements
// value: single value or object-map with entries of {langtag: value} where langtag in {Langtags}
//
// return value: object-map of {langtag: string} for all langtag in {Langtags}
const getDisplayValue = f.curryN(2)((column = {}, value) => {
  return retrieveDisplayValue(column)(value);
});

const retrieveDisplayValue = column => value => {
  switch (column.kind) {
    case ColumnKinds.link:
      return getLinkValue(column)(value);
    case ColumnKinds.concat:
      return getConcatValue("concats")(column)(value);
    case ColumnKinds.group:
      return getConcatValue("groups")(column)(value);
    case ColumnKinds.boolean:
      return getBoolValue(column)(value);
    case ColumnKinds.attachment:
      return getAttachmentFileName(column)(value);
    case ColumnKinds.currency:
      return getCurrencyValue(column)(value);
    default:
      if (f.startsWith("date", column.kind)) {
        return getDateValue(column)(value);
      }
      return getDefaultValue(column)(value);
  }
};

const merge = (coll, [key, value]) => {
  coll[key] = value;
  return coll;
};

// Helper to build a multilang object
const applyToAllLangs = fn =>
  Langtags.map(lt => [lt, fn(lt)]).reduce(merge, {});

// To catch cases where (obj.langtag || obj.DefaultLangtag) is falsey, but obj still has langtag keys
const isLangObj = obj => !f.isEmpty(f.intersection(f.keys(obj), Langtags));
// Retrieve obj[lantag] or obj[DefaultLangtag].
// If both are unset, return null if obj has language keys but not langtag or DefaultLangtag, else return obj
const getValueForLang = (obj, lt) =>
  f.get(lt, obj) || (isLangObj(obj) ? null : obj) || "";

// Return cell.value
const getDefaultValue = column => value =>
  applyToAllLangs(lt => {
    const val = getValueForLang(value, lt) || "";
    return f.isEmpty(val) && !f.isNumber(val) ? "" : format(column, val);
  });

const getCurrencyValue = column => value =>
  applyToAllLangs(lt => {
    const country = getCountryOfLangtag(lt);
    const rawValue = getCurrencyWithCountry(value, country, true);

    const currencyCode = getCurrencyCode(country);

    // TODO use localization lib
    const val = f.isNil(rawValue)
      ? ""
      : f.join(" ", [String(rawValue).replace(".", ","), currencyCode]);

    return f.isEmpty(val) && !f.isNumber(val) ? "" : format(column, val);
  });

// bool -> column display name || ""
const getBoolValue = column => value => {
  const getValue = lt => {
    const isTrue = f.find(f.isBoolean, [
      ...f.props([lt, DefaultLangtag], value),
      value,
      false
    ]); // allow false
    return isTrue && !isLangObj(isTrue)
      ? column.displayName[lt] || column.displayName[DefaultLangtag]
      : "";
  };
  return applyToAllLangs(getValue);
};

// convert date to human-friendly format
const getDateValue = column => value => {
  const getDate = lt => {
    const date = getValueForLang(value, lt);
    const Formats =
      column.kind === ColumnKinds.datetime ? DateTimeFormats : DateFormats;
    return f.isEmpty(date)
      ? ""
      : Moment(date, Formats.formatForServer).format(
          getValueForLang(column.format, lt) || Formats.formatForUser
        );
  };
  return applyToAllLangs(getDate);
};

// const getLinkValue = () => () => {return {de: "test"}}

const getLinkValue = column =>
  f.map(
    f.flow(
      f.get("value"),
      getDisplayValue(column.toColumn)
    )
  );

const getAttachmentFileName = column => links => {
  const getFileName = (lt, link) =>
    f.flow(
      f.props([
        ["title", lt],
        ["externalName", lt],
        ["internalName", lt],
        ["title", DefaultLangtag],
        ["externalName", DefaultLangtag],
        ["internalName", DefaultLangtag]
      ]),
      f.find(f.complement(f.isEmpty)),
      f.defaultTo("unnamed file")
    )(link);

  return f.map(
    link => applyToAllLangs(langtag => getFileName(langtag, link)),
    links
  );
};

// recursively concatenate string values
const getConcatValue = selector => column => value => {
  const concats = f.zip(f.get(selector, column), value);
  const displayValues = f.flatten(
    // flatten so link values get concatenated, too
    f.map(([col, val]) => getDisplayValue(col)(val), concats)
  );

  return applyToAllLangs(lt => format(column, f.map(f.get(lt), displayValues)));
};

const getColumnIdForIndex = (column, index) => {
  const index2columnId = f.flow(
    f.get("groups"),
    f.map("id"),
    f.nth(index - 1)
  );
  return index2columnId(column);
};

const moustache = f.memoize(
  n => new RegExp(`\\{\\{${n}\\}\\}`, "g") // double-escape regex generator string to get single-escaped regex-braces
);

// Replace all moustache expressions "{{i}}" of the column's format string where i in [1,..,N], N = displayValue.length,
// with displayValue[i]
const format = f.curryN(2)((column, displayValue) => {
  const formatPattern = f.get("formatPattern", column);
  if (f.isEmpty(formatPattern)) {
    // no or empty format string => simple concat
    return f.isArray(displayValue)
      ? displayValue.map(str => f.trim(str)).join(" ")
      : f.trim(displayValue);
  }

  const valueArray = f.isArray(displayValue) ? displayValue : [displayValue];
  // replace all occurences of {{n+1}} with displayValue[n]; then recur with n = n+1
  // Because the formatPatterns consists of absolute columnId we first have to map index to columnId
  const applyFormat = function(result, dVal = valueArray, i = 1) {
    return f.isEmpty(dVal)
      ? result
      : applyFormat(
          result.replace(
            moustache(getColumnIdForIndex(column, i)),
            f.trim(f.first(dVal))
          ),
          f.tail(dVal),
          i + 1
        );
  };

  return f.trim(applyFormat(formatPattern));
});

const defaultTestGroups = {groups: [{id: 1}, {id: 2}, {id: 3}]};
const tests = {
  title: "formatting",
  tests: [
    ["is", "foo", format, [{}, "foo"]],
    ["is", "foo bar", format, [{}, ["foo", "bar"]]],
    [
      "is",
      "testVal foo",
      format,
      [{formatPattern: "testVal {{1}}", ...defaultTestGroups}, "foo"]
    ],
    [
      "is",
      "foo bar baz",
      format,
      [{formatPattern: "{{1}} bar {{2}}", ...defaultTestGroups}, ["foo", "baz"]]
    ],
    [
      "is",
      "1 x 2 x 3mm",
      format,
      [
        {formatPattern: "{{1}} x {{2}} x {{3}}mm", ...defaultTestGroups},
        [1, 2, 3]
      ]
    ],
    [
      "is",
      "2 times moustaches is 2 times the fun",
      format,
      [
        {
          formatPattern: "{{1}} times {{2}} is {{1}} times the fun",
          ...defaultTestGroups
        },
        [2, "moustaches"]
      ]
    ],
    ["is", "foo bar", format, [{formatPattern: ""}, ["foo", "bar"]]],
    ["not", "foo bar", format, [{formatPattern: " "}, ["foo", "bar"]]],
    ["is", "foo bar", format, [{formatPattern: ""}, [" foo", " bar    "]]],
    ["not", "foo   bar", format, [{formatPattern: ""}, ["foo ", " bar"]]],
    [
      "is",
      "1 test with index NOT EQUALS columnId",
      format,
      [
        {
          formatPattern: "1 test with {{42}} NOT EQUALS {{43}}",
          groups: [{id: 42}, {id: 43}]
        },
        ["index", "columnId"]
      ]
    ]
  ]
};

export {format, tests};
export default getDisplayValue;
