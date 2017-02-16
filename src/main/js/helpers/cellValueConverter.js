import {ColumnKinds, DateFormats, DateTimeFormats} from "../constants/TableauxConstants";
import * as f from "lodash/fp";
import Moment from "moment";

const {shorttext,richtext,text,link,numeric,boolean,concat,attachment,datetime,currency,date} = ColumnKinds;

// (string, string) -> bool
const canConvert = (from, to) => {
  if (from === to) {
    return true;
  }
  else if (from === text) {
    return f.contains(to, [numeric, date, datetime, shorttext,richtext]);
  }
  else if (to === text) {
    return f.contains(from, [numeric, shorttext, richtext, date, datetime]);
  }
  else {
    return canConvert(from, text) && canConvert(text, to);
  }
};

// string -> string
const cleanString = f.compose(f.trim, f.replace("\n", " "));

// string -> value
const fromText = {
  [shorttext]: cleanString,
  [richtext]: f.identity,
  [numeric]: f.compose(f.defaultTo(null), f.parseInt(10), cleanString),
  [date]: str => {
    const dateString = f.compose(f.join(""), f.take(DateFormats.formatForUser.length), cleanString)(str);
    const mom = Moment(dateString, DateFormats.formatForUser);
    return (mom.isValid()) ? mom : null;
  },
  [datetime]: str => {
    const mom = Moment(cleanString(str), DateTimeFormats.formatForUser);
    return (mom.isValid()) ? mom : null;
  }
};

// value -> string
const toText = {
  [shorttext]: f.identity,
  [richtext]: f.identity,
  [numeric]: num => num.toString(),
  [date]: mom => mom.format(DateFormats.formatForUser),
  [datetime]: str => Moment(str).format(DateTimeFormats.formatForUser),
};

// (string, string, value) -> value
const convertSingleValue = f.curry(
  (from, to, value) => {
    if (to === text) {
      return toText[from](value);
    }
    else if (from === text) {
      return fromText[to](value);
    }
    else {
      return f.compose(fromText[to], toText[from])(value);
    }
  }
);

// (str, str, value|object) -> value|object
const convert = (from, to, value) => {
  if (!canConvert(from, to)) {
    return null;
  }

  if (from === to) {
    return value;
  }
  else if (f.isObject(value) && !(value instanceof Moment)) {
    const conversion = convertSingleValue(from, to);
    return f.mapValues(conversion, value);
  }
  else {
    return convertSingleValue(from, to, value);
  }
};

export {convert, canConvert};