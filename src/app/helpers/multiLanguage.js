import TableauxConstants, {
  DefaultLanguage,
  FallbackLanguage
} from "../constants/TableauxConstants";
import React from "react";
import f from "lodash/fp";
import { doto } from "./functools";
import { getLangObjSpec } from "./multilanguage-specs";
import { checkOrThrow } from "../specs/type";

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
  checkOrThrow(getLangObjSpec(), json);

  return f.flow(
    f.props([language, defaultLanguage, DefaultLanguage, FallbackLanguage]),
    f.find(f.identity)
  )(json);
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
  DK: "DKK",
  HR: "HRK",
  NZ: "NZD", // New Zealand
  BE: "EUR", // Belgium
  FI: "EUR", // Finland
  GR: "EUR", // Greece
  IE: "EUR", // Ireland
  LU: "EUR", // Luxembourg
  MC: "EUR", // Monaco
  PT: "EUR", // Portugal
  SI: "EUR", // Slovenia
  HK: "HKD", // Hong Kong
  CA: "CAD", // Canada
  JP: "JPY", // Japan
  IN: "INR", // India
  NO: "NOK", // Norway
  BR: "BRL", // Brazil
  BG: "BGN", // Bulgaria
  CN: "CNY", // China
  ID: "IDR", // Indonesia
  HU: "HUF", // Hungary
  IQ: "IQD", // Iraq
  IL: "ILS", // Israel
  KR: "KRW", // Korea South
  KW: "KWD", // Kuwait
  LI: "CHF", // Liechtenstein
  MX: "MXN", // Mexico
  MA: "MAD", // Morocco
  RO: "RON", // Romania
  RU: "RUB", // Russian Federation
  SA: "SAR", // Saudi Arabia
  SG: "SGD", // Singapore
  ZA: "ZAR", // South Africa
  SE: "SEK", // Sweden
  TW: "TWD", // Taiwan
  TH: "THB", // Thailand
  TR: "TRY", // Turkey
  UA: "UAH", // Ukraine
  AE: "AED", // United Arab Emirates
  ME: "EUR", // Montenegro
  RS: "RSD" // Serbia
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

function getTableDisplayName(table, langtag) {
  if (!table || !table.name || !langtag) {
    console.warn(
      "getTableDisplayName called with invalid parameters:",
      table,
      langtag
    );
  } else {
    const tableDisplayName = table.displayName[langtag];
    const fallbackTableDisplayName =
      table.displayName[TableauxConstants.FallbackLanguage] || table.name;
    return f.isNil(tableDisplayName)
      ? fallbackTableDisplayName
      : tableDisplayName;
  }
}

const getMultiLangValue = f.curry((langtag, defaultValue, element) =>
  doto(
    element,
    f.props([
      langtag,
      doto(langtag, f.take(2), f.join("")),
      TableauxConstants.FallbackLanguage,
      TableauxConstants.DefaultLangtag
    ]),
    f.find(f.identity),
    f.defaultTo(defaultValue)
  )
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
  retrieveTranslation: function(language, defaultLanguage) {
    return function(json, overrideLanguage = language) {
      return retrieveTranslation(json, overrideLanguage, defaultLanguage);
    };
  },
  getMultiLangValue,
  getLanguageOrCountryIcon,
  getLanguageOfLangtag,
  getTableDisplayName,
  getCountryOfLangtag,
  getCurrencyCode,
  getFallbackCurrencyValue,
  tests,
  isMultiLanguage,
  isMultiCountry
};
