import TableauxConstants from "../constants/TableauxConstants";
import React from "react";
import _ from "lodash";

const langtagSeparatorRegex = /[-_]/;

/**
 * Parses json for translation value.
 *
 * @param json simple json object
 * @param language e.g. de_DE
 * @param defaultLanguage
 * @returns any
 */
function retrieveTranslation(json, language, defaultLanguage) {
  if (!_.isPlainObject(json)) {
    console.error("json is not a plain object", json);
    throw new Error("json is not a plain object");
  }

  let content = json[language];

  if (typeof defaultLanguage !== "undefined" && defaultLanguage !== language) {
    // fallback to default language if no or empty translation found
    if (typeof content === "undefined" || content === null || content === "") {
      content = json[defaultLanguage];
    }
  }

  return content;
}

function getLanguageOrCountryIcon(langtag) {
  // we try to split on "-" (dash) character
  const langtagSplitted = langtag.split(langtagSeparatorRegex);

  // check if we got a full langtag, e.g. de-CH
  // ... if so return only the country
  // ... otherwise return just the language
  const countryOrLanguage = langtagSplitted.length > 1
    ? langtagSplitted[1]
    : langtagSplitted[0];

  const icon = countryOrLanguage.toLowerCase() + ".png";

  return (
    <span className="langtag">
      <img src={"/img/flags/" + icon} alt={countryOrLanguage} /><span
      className="langtag-label">{countryOrLanguage}</span>
    </span>
  );
}

function getCurrencyCode(country) {
  const currencyCodeMap = {
    DE: "EUR",
    FR: "EUR",
    US: "USD",
    GB: "GBP",
    IT: "EUR",
    PL: "PLN",
    NL: "EUR",
    ES: "EUR",
    AT: "EUR",
    CH: "SFR",
    CZ: "CZK",
    DK: "DKK"
  };
  return currencyCodeMap[country] || null;
}

// converts en-US to US or en to EN
// TODO Map EN to GB or
function getCountryOfLangtag(langtag) {
  const splittedLangtag = langtag.split(langtagSeparatorRegex);
  return splittedLangtag.length > 1 ? splittedLangtag[1] : String(splittedLangtag[0]).toUpperCase();
}

function getLanguageOfLangtag(langtag) {
  return langtag.split(langtagSeparatorRegex)[0];
}

function getTableDisplayName(table, langtag) {
  if (!table || !table.name || !langtag) {
    console.warn("getTableDisplayName called with invalid parameters:", table, langtag);
  } else {
    const tableDisplayName = table.displayName[langtag];
    const fallbackTableDisplayName = table.displayName[TableauxConstants.FallbackLanguage] || table.name;
    return _.isNil(tableDisplayName) ? fallbackTableDisplayName : tableDisplayName;
  }
}

/**
 * example usage:
 * let multiLanguage = require('./multiLanguage.js')
 * // define default language
 * let retrieveTranslation = multilanguage.retrieveTranslation('de_DE')
 *
 * let json = {
 *  "de_DE" : "Deutscher Inhalt",
 *  "en_GB" : null // no english value
 * }
 * let translation = retrieveTranslation(json, "en_GB")
 * // will print "Deutscher Inhalt" b/c of default language
 * Console.println(translation);
 */
module.exports = {
  retrieveTranslation: function (defaultLanguage) {
    return function (json, language) {
      return retrieveTranslation(json, language, defaultLanguage);
    };
  },
  getLanguageOrCountryIcon,
  getLanguageOfLangtag,
  getTableDisplayName,
  getCountryOfLangtag,
  getCurrencyCode
};
