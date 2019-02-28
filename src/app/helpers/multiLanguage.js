import React from "react";
import f from "lodash/fp";

import { checkOrThrow } from "../specs/type";
import { ifElse, when } from "./functools";
import { getLangObjSpec } from "./multilanguage-specs";
import TableauxConstants, {
  DefaultLanguage,
  FallbackLanguage
} from "../constants/TableauxConstants";

const langtagSeparatorRegex = /[-_]/;

/**
 * Parses an object of {[key:string]: any}for translation value.
 *
 * @param json simple json object
 * @param langtag e.g. de_DE or de
 * @returns any
 */
const retrieveTranslation = f.curryN(2, (langtag, json) => {
  checkOrThrow(getLangObjSpec(), json);
  const language = getLanguageOfLangtag(langtag);

  return f.flow(
    f.props([langtag, language, DefaultLanguage, FallbackLanguage]),
    f.find(value => !f.isEmpty(value))
  )(json);
});

function getLanguageOrCountryIcon(langtag, specific = "") {
  // we try to split on "-" (dash) character
  const langtagSplitted = langtag.split(langtagSeparatorRegex);

  // check if we got a full langtag, e.g. de-CH
  // ... if so return only the country
  // ... otherwise return just the language
  // unless asked for "language" or "country"
  // ... in that case we return either language or country from full langtag
  // ... or we expect the country to be expandable like de -> de_DE, it -> it_IT etc.
  const countryOrLanguage =
    langtagSplitted.length > 1 ? langtagSplitted[1] : langtagSplitted[0];

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
      <img src={"/img/flags/" + icon} alt={result} />
      <span className="langtag-label">{result}</span>
    </span>
  );
}

const currencyCodeMap = {
  AE: "AED", // United Arab Emirates
  AT: "EUR", // Austria
  BE: "EUR", // Belgium
  BG: "BGN", // Bulgaria
  BR: "BRL", // Brazil
  CA: "CAD", // Canada
  CH: "SFR", // Switzerland
  CN: "CNY", // China
  CZ: "CZK", // Czechia
  DE: "EUR", // Germany
  DK: "DKK", // Denmark
  ES: "EUR", // Spain
  FI: "EUR", // Finland
  FR: "EUR", // France
  GB: "GBP", // Great Britain
  GR: "EUR", // Greece
  HK: "HKD", // Hong Kong
  HR: "HRK", // Croatia
  HU: "HUF", // Hungary
  ID: "IDR", // Indonesia
  IE: "EUR", // Ireland
  IL: "ILS", // Israel
  IN: "INR", // India
  IQ: "IQD", // Iraq
  IT: "EUR", // Italy
  JP: "JPY", // Japan
  KR: "KRW", // Korea South
  KW: "KWD", // Kuwait
  LI: "CHF", // Liechtenstein
  LU: "EUR", // Luxembourg
  MA: "MAD", // Morocco
  MC: "EUR", // Monaco
  ME: "EUR", // Montenegro
  MX: "MXN", // Mexico
  NL: "EUR", // Netherlands
  NO: "NOK", // Norway
  NZ: "NZD", // New Zealand
  PL: "PLN", // Poland
  PT: "EUR", // Portugal
  RO: "RON", // Romania
  RS: "RSD", // Serbia
  RU: "RUB", // Russian Federation
  SA: "SAR", // Saudi Arabia
  SE: "SEK", // Sweden
  SG: "SGD", // Singapore
  SI: "EUR", // Slovenia
  TH: "THB", // Thailand
  TR: "TRY", // Turkey
  TW: "TWD", // Taiwan
  UA: "UAH", // Ukraine
  US: "USD", // United States of America
  ZA: "ZAR" // South Africa
};

const reverseCurrencyCodeMap = f
  .keys(currencyCodeMap)
  .reduce((aggregator, country) => {
    const key = currencyCodeMap[country];
    if (!aggregator[key]) {
      aggregator[key] = [country];
      return aggregator;
    } else {
      aggregator[key].push(country);
      return aggregator;
    }
  }, {});

const getFallbackCurrencyValue = f.curry(
  ({ country, fromLangtag = false }, value = {}) => {
    const _country = fromLangtag ? getCountryOfLangtag(country) : country;
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
  return splittedLangtag.length > 1
    ? splittedLangtag[1]
    : String(splittedLangtag[0]).toUpperCase();
}

function getLanguageOfLangtag(langtag) {
  return langtag.split(langtagSeparatorRegex)[0];
}

// data structure for columns is identical
function getTableDisplayName(table, langtag) {
  if (!table || !table.name || !langtag) {
    console.warn(
      "getTableDisplayName called with invalid parameters:",
      table,
      langtag
    );
  } else {
    const getDisplayName = f.flow(
      f.propOr({}, "displayName"),
      retrieveTranslation(langtag)
    );
    const hasNoDisplayName = f.flow(
      f.isEmpty,
      getDisplayName
    );
    return ifElse(hasNoDisplayName, f.prop("name"), getDisplayName)(table);
  }
}

const getMultiLangValue = f.curry((langtag, defaultValue, element) =>
  when(f.isEmpty, f.always(defaultValue))(retrieveTranslation(langtag, element))
);

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
    ["is", 42, getFallbackCurrencyValue, [{ country: "IT" }, { DE: 42 }]],
    [
      "is",
      42,
      getFallbackCurrencyValue,
      [{ country: "de-DE", fromLangtag: true }, { IT: 42 }]
    ],
    [
      "conformsTo",
      f.isNil,
      getFallbackCurrencyValue,
      [{ country: "US" }, { GB: 1, DE: 2, CH: 3 }]
    ],
    [
      "is",
      "Deutscher Inhalt",
      retrieveTranslation,
      // eslint-disable-next-line camelcase
      [{ de_DE: "Deutscher Inhalt", en_GB: null }, "en_GB", "de_DE"]
    ]
  ]
};

// if all object keys are langtags, value is multi language
const isMultiLanguage = value =>
  f.isObject(value) &&
  f.all(f.contains(f.__, TableauxConstants.Langtags), f.keys(value));

// if all object keys are country codes, value is multi country
const isMultiCountry = value => {
  const countries = f.keys(currencyCodeMap);
  return f.isObject(value) && f.all(f.contains(f.__, countries), f.keys(value));
};
module.exports = {
  retrieveTranslation,
  getMultiLangValue,
  getLanguageOrCountryIcon,
  getLanguageOfLangtag,
  getTableDisplayName,
  getColumnDisplayName: getTableDisplayName,
  getCountryOfLangtag,
  getCurrencyCode,
  getFallbackCurrencyValue,
  tests,
  isMultiLanguage,
  isMultiCountry
};
