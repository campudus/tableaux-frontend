import * as f from "lodash/fp";
import Moment from "moment";
import {
  ColumnKinds,
  DateFormats,
  DateTimeFormats,
  DefaultLangtag,
  Langtags
} from "../constants/TableauxConstants";
import {
  getCountryOfLangtag,
  getCurrencyCode,
  getFallbackCurrencyValue
} from "./multiLanguage";

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
    case ColumnKinds.numeric:
      return getNumberValue(column)(value);
    case ColumnKinds.status:
      return getStatusValue(column)(value);
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
const isLangObj = column => column.multilanguage; //!f.isEmpty(f.intersection(f.keys(obj), Langtags));
// Retrieve obj[lantag] or obj[DefaultLangtag].
// If both are unset, return null if obj has language keys but not langtag or DefaultLangtag, else return obj
const getValueForLang = (obj, lt, column) =>
  f.get(lt, obj) || (isLangObj(column) ? null : obj) || "";

const getNumberValue = column => value => {
  const getNumber = lt => {
    const number = column.multilanguage ? value && value[lt] : value;
    return f.isNumber(number) && !f.isNaN(number) ? String(number) : "";
  };
  return applyToAllLangs(getNumber);
};

// Return cell.value
const getDefaultValue = column => value =>
  applyToAllLangs(lt => {
    const val = f.isNumber(value)
      ? value
      : getValueForLang(value, lt, column) || "";

    return f.isEmpty(val) && !f.isNumber(val) ? "" : format(column, val);
  });

function getCurrencyWithCountry(currencyObj, country, withFallback = false) {
  const result = f.getOr(null, country, currencyObj);
  const fallBack = getFallbackCurrencyValue({ country }, currencyObj) || null;
  return withFallback ? result || fallBack : result;
}

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
const getBoolValue = f.curry((column, value) => {
  const getValue = lt => {
    const isTrue = f.find(f.isBoolean, [
      ...f.props([lt, DefaultLangtag], value),
      value,
      false
    ]); // allow false
    return isTrue && !isLangObj(column)
      ? column.displayName[lt] ||
          column.displayName[DefaultLangtag] ||
          column.name
      : "";
  };
  return applyToAllLangs(getValue);
});

// convert date to human-friendly format
const getDateValue = column => value => {
  const getDate = lt => {
    const date = getValueForLang(value, lt, column);
    const Formats =
      column.kind === ColumnKinds.datetime ? DateTimeFormats : DateFormats;
    return f.isEmpty(date)
      ? ""
      : Moment(date, Formats.formatForServer).format(
          getValueForLang(column.format, lt, column) || Formats.formatForUser
        );
  };
  return applyToAllLangs(getDate);
};

const getStatusValue = column => value =>
  (column.rules || [])
    .filter((_, idx) => value[idx])
    .map(rule => rule.name)
    .join(",");

const getLinkValue = column =>
  f.map(f.flow(f.get("value"), getDisplayValue(column.toColumn)));

const getAttachmentFileName = () => links => {
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
  const displayValues = f.map(([col, val]) => {
    const displayValue = getDisplayValue(col)(val);
    // 1. merge all link displayValues to a single displayValue:
    // [{ de-DE: "Stahl", en-GB: "steel" }, { de-DE: "Aluminium", en-GB: "aluminium" }] -> { de-DE: "Stahl Aluminium", en-GB: "steel aluminium" }
    // 2. ensure that empty links have a displayValue:
    // [] -> { de-DE: "", en-GB: "" }
    return f.isArray(displayValue)
      ? applyToAllLangs(lt => f.map(f.get(lt), displayValue).join(" "))
      : displayValue;
  }, concats);

  return applyToAllLangs(lt => format(column, f.map(f.get(lt), displayValues)));
};

const moustache = f.memoize(
  n => new RegExp(`\\{\\{${n}\\}\\}`, "g") // double-escape regex generator string to get single-escaped regex-braces
);

// Replace all moustache expressions "{{i}}" of the column's format string where i in [1,..,N], N = displayValue.length,
// with displayValue[i]
const format = f.curryN(2)((column, displayValue) => {
  const formatPattern = f.get("formatPattern", column);
  const placeholder = "_"; // Set to "" to disable placeholders

  if (f.isEmpty(formatPattern)) {
    // no or empty format string => simple concat
    return f.isArray(displayValue)
      ? displayValue
          .map(str => f.trim(str))
          .join(" ")
          .trim()
      : f.trim(displayValue);
  } else {
    const valueArray = f.isArray(displayValue) ? displayValue : [displayValue];
    const hasAnyValues =
      !f.isEmpty(valueArray) && !f.every(f.isEmpty, valueArray);

    const innerColumns =
      column.kind === ColumnKinds.concat
        ? f.get("concats", column)
        : f.get("groups", column);
    // replace all occurences of {{n+1}} with displayValue[n];
    // Because the formatPatterns consists of absolute columnId we first have to map index to columnId
    const applyFormat = (result, dVal, idx) => {
      const colId = innerColumns[idx]?.id;

      // Boolean columns are a special case; falsy bool values deliver an empty string which we want to keep
      const isEmptyValue =
        f.get(`${idx}.kind`, innerColumns) === ColumnKinds.boolean
          ? f.F
          : f.isEmpty;

      const formattedValue = f.trim(isEmptyValue(dVal) ? placeholder : dVal);
      return result.replace(moustache(colId), formattedValue);
    };

    const formattedString =
      hasAnyValues || !f.isEmpty(placeholder)
        ? f.trim(valueArray.reduce(applyFormat, formatPattern))
        : "";
    return formattedString.replace(/\{.*?\}\}/g, placeholder); // remove remaining placeholders
  }
});

export { format };
export default getDisplayValue;
