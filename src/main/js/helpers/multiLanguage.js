import TableauxConstants from "../constants/TableauxConstants";
import React from "react";
import f from "lodash/fp";

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
  if (!f.isPlainObject(json)) {
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

function getLanguageOrCountryIcon(langtag, specific = "") {
  // we try to split on "-" (dash) character
  const langtagSplitted = langtag.split(langtagSeparatorRegex);

  // check if we got a full langtag, e.g. de-CH
  // ... if so return only the country
  // ... otherwise return just the language
  // unless asked for "language" or "country"
  // ... in that case we return either language or country from full langtag
  // ... or we expect the country to be expandable like de -> de_DE, it -> it_IT etc.
  const countryOrLanguage = langtagSplitted.length > 1
    ? langtagSplitted[1]
    : langtagSplitted[0];

  const getResult = ([lang]) => {
    if (specific.startsWith("c")) {
      return getCountryOfLangtag(langtag);
    } else if (specific.startsWith("l")) {
      return lang;
    } else {
      return countryOrLanguage;
    }
  };

  const icon = countryOrLanguage.toLowerCase() + ".png";
  const result = countryOrLanguage || getResult(langtagSplitted);

  return (
    <span className="langtag">
      <img src={"/img/flags/" + icon} alt={result} /><span
        className="langtag-label">{result}</span>
    </span>
  );
}

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

const reverseCurrencyCodeMap = f.keys(currencyCodeMap).reduce(
  (aggregator, country) => {
    const key = currencyCodeMap[country];
    if (!aggregator[key]) {
      aggregator[key] = [country];
      return aggregator;
    } else {
      aggregator[key].push(country);
      return aggregator;
    }
  },
  {}
);

const getFallbackCurrencyValue = f.curry(
  ({country, fromLangtag = false}, value = {}) => {
    const _country = (fromLangtag) ? getCountryOfLangtag(country) : country;
    const currency = getCurrencyCode(_country);
    const fallbackEntry = f.flow(
      f.reject(f.eq(_country)),
      f.find(ctry => !f.isEmpty(value[ctry]) || f.isNumber(value[ctry]))
    )(reverseCurrencyCodeMap[currency]);
    return f.get(fallbackEntry, value);
  }
);

function getCurrencyCode(country) {
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
    return f.isNil(tableDisplayName) ? fallbackTableDisplayName : tableDisplayName;
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

const tests = {
  title: "MultiLanguage helper",
  tests: [
    ["is", 6, f.size, [reverseCurrencyCodeMap["EUR"]]],
    ["is", "SFR", getCurrencyCode, [getCountryOfLangtag("de-CH")]],
    ["is", 42, getFallbackCurrencyValue, [{country: "IT"}, {DE: 42}]],
    ["is", 42, getFallbackCurrencyValue, [{country: "de-DE", fromLangtag: true}, {IT: 42}]],
    ["conformsTo", f.isNil, getFallbackCurrencyValue, [{country: "US"}, {GB: 1, DE: 2, CH: 3}]],
    ["is", "Deutscher Inhalt", retrieveTranslation, [{"de_DE": "Deutscher Inhalt", "en_GB": null}, "en_GB", "de_DE"]]
  ]
};

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
  getCurrencyCode,
  getFallbackCurrencyValue,
  tests
};
