import Keks from "js-cookie";
import f from "lodash/fp";

import { getCountryOfLangtag } from "./multiLanguage";
import { merge, when, withTryCatch } from "./functools";
import TableauxConstants, { ColumnKinds } from "../constants/TableauxConstants";

// overwrite converter so we can parse express-cookies
const Cookies = Keks.withConverter({
  read: function(rawValue) {
    const value = decodeURIComponent(rawValue);
    return when(
      f.allPass([f.isString, f.startsWith("j:")]),
      withTryCatch(
        v => JSON.parse(v.substring(2)), // remove starting j:
        e => {
          console.error("Access cookie couldn't be parsed:", e);
        }
      ),
      value
    );
  },
  write: function(value) {
    return encodeURIComponent(value);
  }
});

const mergeWithLocalDevSettings = params => {
  try {
    const localSettings = require("../../../devAccessSettings.json");
    return merge(params, localSettings);
  } catch (err) {
    return params;
  }
};

/**
 * Sets user access cookie in dev, when the server doesn't.
 * @params cookieParams: { isAdmin?: boolean
 *                         langtagsAccess?: string[]
 *                         countryCodesAccess?: string[]
 *                       }
 **/
export function initDevelopmentAccessCookies(usersParams) {
  if (process.env.NODE_ENV !== "production") {
    const cookieParams = mergeWithLocalDevSettings(usersParams);
    const isAdmin = when(f.isNil, f.stubTue, f.get("isAdmin", cookieParams));
    const langtagsAccess = f.getOr(["en_GB"], "langtagsAccess", cookieParams);
    const countryCodesAccess = f.getOr(
      ["en_GB"],
      "countryCodesAccess",
      cookieParams
    );

    Cookies.set("userAdmin", isAdmin);
    Cookies.set("userLangtagsAccess", `j:${JSON.stringify(langtagsAccess)}`);
    Cookies.set(
      "userCountryCodesAccess",
      `j:${JSON.stringify(countryCodesAccess)}`
    );

    console.log(
      "Dev access settings:",
      isUserAdmin() ? "admin," : "user,",
      isUserAdmin()
        ? "all countries & langtags"
        : `countries: ${getUserCountryCodesAccess()}, langtags: ${getUserLanguageAccess()}`
    );
  }
}

export const getUserLanguageAccess = f.memoize(function() {
  if (isUserAdmin()) {
    return TableauxConstants.Langtags;
  } else {
    return Cookies.getJSON("userLangtagsAccess") || [];
  }
});

export const getUserCountryCodesAccess = f.memoize(function() {
  if (isUserAdmin()) {
    return []; // there's no "all available country codes" because it's bound to a column
  } else {
    return Cookies.getJSON("userCountryCodesAccess") || [];
  }
});

export const hasUserAccessToCountryCode = f.memoize(function(countryCode) {
  if (isUserAdmin()) {
    return true;
  }

  if (f.isString(countryCode)) {
    const userCountryCodes = getUserCountryCodesAccess();
    return userCountryCodes && userCountryCodes.length > 0
      ? userCountryCodes.indexOf(countryCode) > -1
      : false;
  } else {
    console.error(
      "hasUserAccessToCountryCode() has been called with unknown parameter countryCode:",
      countryCode
    );
    return false;
  }
});

export const isUserAdmin = f.memoize(function() {
  const isAdminFromCookie = Cookies.getJSON("userAdmin");
  if (!f.isNil(isAdminFromCookie)) {
    return isAdminFromCookie;
  } else return false;
});

// Can a user edit the given langtag
export const hasUserAccessToLanguage = f.memoize(function(langtag) {
  if (isUserAdmin()) {
    return true;
  }

  if (f.isString(langtag)) {
    const userLanguages = getUserLanguageAccess();
    return userLanguages && userLanguages.length > 0
      ? userLanguages.indexOf(langtag) > -1
      : false;
  } else {
    console.error(
      "hasUserAccessToLanguage() has been called with unknown parameter langtag:",
      langtag
    );
    return false;
  }
});

// No langtag: Is the user allowed to change this cell in general?
// Langtag: Is the user allowed to change this cell in this language
export function canUserChangeCell(cell, langtag) {
  if (!cell) {
    console.warn(
      "hasUserAccesToCell() called with invalid parameter cell:",
      cell
    );
    return false;
  }

  // Admins can do everything
  if (isUserAdmin()) {
    return true;
  }

  // User is not admin
  // Links and attachments are considered single language
  return !!(
    cell.column.multilanguage &&
    (cell.column.kind === ColumnKinds.text ||
      cell.column.kind === ColumnKinds.shorttext ||
      cell.column.kind === ColumnKinds.richtext ||
      cell.column.kind === ColumnKinds.numeric ||
      cell.column.kind === ColumnKinds.boolean ||
      cell.column.kind === ColumnKinds.datetime ||
      cell.column.kind === ColumnKinds.currency) &&
    (f.isNil(langtag) || cell.column.languageType === "country"
      ? hasUserAccessToCountryCode(getCountryOfLangtag(langtag))
      : hasUserAccessToLanguage(langtag))
  );
}

// Reduce the value object before sending to server, so that just allowed languages gets sent
export function reduceValuesToAllowedLanguages(valueToChange) {
  if (isUserAdmin()) {
    return valueToChange;
  } else {
    return f.pick(getUserLanguageAccess(), valueToChange);
  }
}

// Reduce the value object before sending to server, so that just allowed countries gets sent
export function reduceValuesToAllowedCountries(valueToChange) {
  if (isUserAdmin()) {
    return valueToChange;
  } else {
    return f.pick(getUserCountryCodesAccess(), valueToChange);
  }
}

export function reduceMediaValuesToAllowedLanguages(fileInfos) {
  if (isUserAdmin()) {
    return fileInfos;
  }
  return f.map(fileInfo => {
    if (f.isObject(fileInfo)) {
      return f.pick(getUserLanguageAccess(), fileInfo);
    } else {
      return fileInfo;
    }
  }, fileInfos);
}
