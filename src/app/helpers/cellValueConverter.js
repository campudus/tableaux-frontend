import {
  ColumnKinds,
  DateFormats,
  DateTimeFormats
} from "../constants/TableauxConstants";
import * as f from "lodash/fp";
import Moment from "moment";

const {
  shorttext,
  richtext,
  text,
  numeric,
  datetime,
  date,
  integer
} = ColumnKinds;

// (string, string) -> bool
const canConvert = (from, to) => {
  if (from === to) {
    return true;
  } else if (from === text) {
    return f.contains(to, [
      numeric,
      date,
      datetime,
      shorttext,
      richtext,
      integer
    ]);
  } else if (to === text) {
    return f.contains(from, [
      integer,
      numeric,
      shorttext,
      richtext,
      date,
      datetime
    ]);
  } else {
    return canConvert(from, text) && canConvert(text, to);
  }
};

// string -> string
const cleanString = f.flow(f.replace("\n", " "), f.trim);

const momentFromString = str => {
  // this is more robust downstream than just Moment(str, [formats], true)
  if (!f.isString(str)) {
    return null;
  }
  const createMoment = input => format => {
    const moment = Moment(input, format, true); // true is for strict mode
    return moment.isValid() ? moment : null;
  };
  const values = f.map(createMoment(str), [
    DateTimeFormats.formatForUser,
    DateFormats.formatForUser,
    DateTimeFormats.formatForServer
  ]);
  return f.first(f.compact, values);
};

const textToNumber = f.flow(cleanString, f.parseInt(10), f.defaultTo(null));
// string -> value
const fromText = {
  [shorttext]: cleanString,
  [richtext]: f.identity,
  [numeric]: textToNumber,
  [integer]: textToNumber,
  [date]: str => {
    const mom = f.isEmpty(str) ? null : momentFromString(str);
    return mom ? mom.format(DateFormats.formatForServer) : null;
  },
  [datetime]: str => {
    const mom = f.isEmpty(str) ? null : momentFromString(str);
    return mom ? mom.format(DateTimeFormats.formatForServer) : null;
  }
};

// value -> string
const toText = {
  [shorttext]: f.identity,
  [richtext]: f.identity,
  [numeric]: num => num.toString(),
  [integer]: num => num.toString(),
  [date]: str => {
    const moment = momentFromString(str);
    return moment ? moment.format(DateFormats.formatForUser) : null;
  },
  [datetime]: str => {
    const moment = momentFromString(str);
    return moment ? moment.format(DateTimeFormats.formatForUser) : null;
  }
};

// (string, string, value) -> value
const convertSingleValue = f.curry((from, to, value) => {
  if (to === text) {
    return toText[from](value);
  } else if (from === text) {
    return fromText[to](value);
  } else {
    return f.flow(toText[from], fromText[to])(value);
  }
});

// (str, str, value|object) -> value|object
const convert = (from, to, value) => {
  if (!canConvert(from, to)) {
    return null;
  }

  if (from === to) {
    return value;
  } else if (f.isObject(value) && !(value instanceof Moment)) {
    const conversion = convertSingleValue(from, to);
    return f.mapValues(conversion, value);
  } else {
    return convertSingleValue(from, to, value);
  }
};

export { convert, canConvert };
