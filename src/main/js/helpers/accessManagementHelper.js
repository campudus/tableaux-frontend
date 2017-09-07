import _ from "lodash";
import TableauxConstants, {ColumnKinds} from "../constants/TableauxConstants";
import Keks from "js-cookie";

// overwrite converter so we can parse express-cookies
const Cookies = Keks.withConverter({
  "read": function (rawValue, name) {
    const value = decodeURIComponent(rawValue);
    if (typeof value === "string" && _.startsWith(value, "j:")) {
      let result = value;

      try {
        // remove j:
        result = JSON.parse(value.substring(2));
      } catch (ex) {
        console.error("Keks couldn't be parsed!", ex);
      }

      return result;
    } else {
      return value;
    }
  },
  "write": function (value, name) {
    return encodeURIComponent(value);
  }
});

// Just for development
export function initDevelopmentAccessCookies() {
  if (process.env.NODE_ENV !== "production") {
    Cookies.set("userAdmin", true);
    Cookies.set("userLangtagsAccess", 'j:["en"]');
    Cookies.set("userCountryCodesAccess", 'j:["GB"]');
  }
}

export const getUserLanguageAccess = _.memoize(
  function () {
    if (isUserAdmin()) {
      return TableauxConstants.Langtags;
    } else {
      return Cookies.getJSON("userLangtagsAccess") || [];
    }
  }
);

export const getUserCountryCodesAccess = _.memoize(
  function () {
    if (isUserAdmin()) {
      return []; // there's no "all available country codes" because it's bound to a column
    } else {
      return Cookies.getJSON("userCountryCodesAccess") || [];
    }
  }
);

export const hasUserAccessToCountryCode = _.memoize(
  function (countryCode) {
    if (isUserAdmin()) {
      return true;
    }

    if (_.isString(countryCode)) {
      const userCountryCodes = getUserCountryCodesAccess();
      return (userCountryCodes && userCountryCodes.length > 0)
        ? userCountryCodes.indexOf(countryCode) > -1 : false;
    } else {
      console.error("hasUserAccessToCountryCode() has been called with unknown parameter countryCode:", countryCode);
      return false;
    }
  }
);

export const isUserAdmin = _.memoize(
  function () {
    const isAdminFromCookie = Cookies.getJSON("userAdmin");
    if (!_.isNil(isAdminFromCookie)) {
      return isAdminFromCookie;
    } else return false;
  }
);

// Can a user edit the given langtag
export const hasUserAccessToLanguage = _.memoize(
  function (langtag) {
    if (isUserAdmin()) {
      return true;
    }

    if (_.isString(langtag)) {
      const userLanguages = getUserLanguageAccess();
      return (userLanguages && userLanguages.length > 0)
        ? userLanguages.indexOf(langtag) > -1 : false;
    } else {
      console.error("hasUserAccessToLanguage() has been called with unknown parameter langtag:", langtag);
      return false;
    }
  }
);

// Is the user allowed to change this cell in general? Is it multilanguage and no link or attachment?
export function canUserChangeCell(cell) {
  if (!cell) {
    console.warn("hasUserAccesToCell() called with invalid parameter cell:", cell);
    return false;
  }

  // Admins can do everything
  if (isUserAdmin()) {
    return true;
  }

  // User is not admin
  // Links and attachments are considered single language
  return !!(cell.isMultiLanguage && (
    cell.kind === ColumnKinds.text
    || cell.kind === ColumnKinds.shorttext
    || cell.kind === ColumnKinds.richtext
    || cell.kind === ColumnKinds.numeric
    || cell.kind === ColumnKinds.boolean
    || cell.kind === ColumnKinds.datetime
    || cell.kind === ColumnKinds.currency
  ));
}

// Reduce the value object before sending to server, so that just allowed languages gets sent
export function reduceValuesToAllowedLanguages(valueToChange) {
  console.log("valueToChange:", valueToChange);
  if (isUserAdmin()) {
    return valueToChange;
  } else {
    return {value: _.pick(valueToChange.value, getUserLanguageAccess())};
  }
}

// Reduce the value object before sending to server, so that just allowed countries gets sent
export function reduceValuesToAllowedCountries(valueToChange) {
  if (isUserAdmin()) {
    return valueToChange;
  } else {
    return {value: _.pick(valueToChange.value, getUserCountryCodesAccess())};
  }
}

export function reduceMediaValuesToAllowedLanguages(fileInfos) {
  if (isUserAdmin()) {
    return fileInfos;
  }
  console.log("fileInfos:", fileInfos);
  return _.map(fileInfos, (fileInfo, key) => {
    if (_.isObject(fileInfo)) {
      return _.pick(fileInfo, getUserLanguageAccess());
    } else {
      return fileInfo;
    }
  });
};
