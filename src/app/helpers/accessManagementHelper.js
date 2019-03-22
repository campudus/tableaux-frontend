import TableauxConstants, { ColumnKinds } from "../constants/TableauxConstants";
import Keks from "js-cookie";
import f from "lodash/fp";

// overwrite converter so we can parse express-cookies
const Cookies = Keks.withConverter({
  read: function(rawValue) {
    const value = decodeURIComponent(rawValue);
    if (typeof value === "string" && f.startsWith("j:", value)) {
      try {
        // remove j:
        return JSON.parse(value.substring(2));
      } catch (ex) {
        console.error("Keks couldn't be parsed!", ex);
      }

      return [];
    } else {
      return value;
    }
  },
  write: function(value) {
    return encodeURIComponent(value);
  }
});

/**
 * Sets user access cookie in dev, when the server doesn't.
 * @params cookieParams: { isAdmin?: boolean
 *                         langtagsAccess?: string[]
 *                         countryCodesAccess?: string[]
 *                       }
 **/
export function initDevelopmentAccessCookies(cookieParams) {
  if (process.env.NODE_ENV !== "production") {
    const isAdmin = f.getOr(true, "isAdmin", cookieParams);
    const langtagsAccess = f.getOr(["en"], "langtagsAccess", cookieParams);
    const countryCodesAccess = f.getOr(
      ["GB"],
      "countryCodesAccess",
      cookieParams
    );

    Cookies.set("userAdmin", isAdmin);
    Cookies.set("userLangtagsAccess", `j:${JSON.stringify(langtagsAccess)}`);
    Cookies.set(
      "userCountryCodesAccess",
      `j:${JSON.stringify(countryCodesAccess)}`
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

// Is the user allowed to change this cell in general? Is it multilanguage and no link or attachment?
export function canUserChangeCell(cell) {
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
    cell.isMultiLanguage &&
    (cell.kind === ColumnKinds.text ||
      cell.kind === ColumnKinds.shorttext ||
      cell.kind === ColumnKinds.richtext ||
      cell.kind === ColumnKinds.numeric ||
      cell.kind === ColumnKinds.boolean ||
      cell.kind === ColumnKinds.datetime ||
      cell.kind === ColumnKinds.currency)
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
