import Moment from "moment";
import React from "react";
import f from "lodash/fp";
import i18n from "i18next";

import { checkOrThrow } from "../specs/type";
import { either, ifElse, match, maybe, memoizeWith, when } from "./functools";
import { getLangObjSpec } from "./multilanguage-specs";
import TableauxConstants, {
  ColumnKinds,
  DefaultLangtag,
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
  if (!json) {
    return "";
  }
  checkOrThrow(getLangObjSpec(), json);
  const language = getLanguageOfLangtag(langtag);

  return f.flow(
    f.props([langtag, language, DefaultLangtag, FallbackLanguage]),
    f.find(value => !f.isEmpty(value))
  )(json);
});

const languagePartRegex = /[a-z]{2}/;
const countryPartRegex = /[A-Z]{2}/;
const matchWholeString = (...matchers) =>
  new RegExp(
    ["^", ...matchers, "$"].reduce(
      (accum, nextMatcher) =>
        accum +
        (nextMatcher instanceof RegExp ? nextMatcher.source : nextMatcher)
    )
  );
const languageRegex = matchWholeString(languagePartRegex);
const countryRegex = matchWholeString(countryPartRegex);
const fullLangtagRegex = matchWholeString(
  languagePartRegex,
  "-",
  countryPartRegex
);

const matchesRegex = regex => string =>
  f.isString(string) && regex.test(string);

const isLangtag = input =>
  matchesRegex(fullLangtagRegex)(input) || matchesRegex(languageRegex)(input);
const isCountryTag = input =>
  matchesRegex(fullLangtagRegex)(input) || matchesRegex(countryRegex)(input);

/**
 * Try to return a matching country icon, falling back to languag icon.
 * @param langtag string, language or country tag (ln, ln-CT or CT)
 * @param specific ["language", "country"] which tag to prefer, default = "country"
 * @returns React element with flag icon and country/language string
 **/
function getLanguageOrCountryIcon(langtag, specific = "country") {
  const languagePart = getLanguageOfLangtag(langtag);
  const countryPart = getCountryOfLangtag(langtag);

  const countryOrLanguageTag =
    specific.startsWith("l") || !countryPart ? languagePart : countryPart;
  const iconUrl = maybe(countryOrLanguageTag)
    .exec("toLowerCase")
    .map(basename => "/img/flags/" + basename + ".png")
    .getOrElse(null);

  if (f.isNil(countryOrLanguageTag)) {
    console.warn("No", specific, "icon for input", typeof langtag, langtag);
  }

  return (
    <span className="langtag">
      <img src={iconUrl} alt={countryOrLanguageTag} />
      <span className="langtag-label">{countryOrLanguageTag}</span>
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
  return isCountryTag(langtag) ? langtag.match(countryPartRegex)[0] : null;
}

function getLanguageOfLangtag(langtag) {
  return isLangtag(langtag) ? langtag.match(languagePartRegex)[0] : null;
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
      getDisplayName,
      f.isEmpty
    );
    return ifElse(hasNoDisplayName, f.prop("name"), getDisplayName)(table);
  }
}

const getColumnDisplayName = (column, langtag) =>
  column.kind === ColumnKinds.concat
    ? i18n.t("table:concat_column_name")
    : getTableDisplayName(column, langtag);

const getMultiLangValue = f.curry((langtag, defaultValue, element) =>
  when(f.isEmpty, f.always(defaultValue))(retrieveTranslation(langtag, element))
);

/**
 * example usage:
 * let multiLanguage = require('./multiLanguage.js')
 *
 * let json = {
 *  "de_DE" : "Deutscher Inhalt",
 *  "en_GB" : null // no english value
 * }
 * let translation = multilanguage.retrieveTranslation("en_GB", json)
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

const toPlainDate = timestamp => {
  if (timestamp instanceof Date) {
    return timestamp;
  } else if (timestamp instanceof Moment) {
    return new Date(timestamp);
  } else if (f.isString(timestamp)) {
    const m = Moment(timestamp);
    if (m.isValid()) return new Date(m);
  }
  throw new Error(
    `toPlainDate(${timestamp}): expected Moment, Date, or parseable date string, but got ${typeof timestamp}`
  );
};

// Formatters. Locale is automatically chosen by routing. It should
// only be passed for tests.
const formatDate = (timestamp, locale = i18n.language) =>
  either(timestamp)
    .map(toPlainDate)
    .exec("toLocaleDateString", locale)
    .getOrElse("");

const formatTime = (timestamp, locale = i18n.language) =>
  either(timestamp)
    .map(toPlainDate)
    .exec("toLocaleTimeString", locale)
    .getOrElse("");

const formatTimeShort = (timestamp, locale = i18n.language) =>
  either(timestamp)
    .map(toPlainDate)
    .exec("toLocaleTimeString", locale, { hour: "2-digit", minute: "2-digit" })
    .getOrElse("");

const formatDateTime = (timestamp, locale = i18n.language) =>
  either(timestamp)
    .map(toPlainDate)
    .exec("toLocaleString", locale)
    .getOrElse("");

const formatNumber = (number, locale = i18n.language) => {
  return f.isNil(number) ||
    f.isNaN(number) ||
    (!f.isNumber(number) && f.isEmpty(number)) ||
    f.isObject(number)
    ? ""
    : f.toNumber(number).toLocaleString(locale);
};

const readLocalizedNumber = (
  localizedNumericString = "",
  locale = i18n.language
) => {
  try {
    const decimalSeparator = getLocaleDecimalSeparator(locale);
    const formattingCharRegex = new RegExp(
      "[^0-9" + decimalSeparator + "-]",
      "g"
    );
    const numberRegex = new RegExp("^-?\\d+(" + decimalSeparator + "\\d+)?");

    const numericString = f.compose(
      f.replace(decimalSeparator, "."), // normalise separator
      match(numberRegex), // assure only one separator exists
      f.replace(formattingCharRegex, "") // remove all chars which are not number or separator
    )(localizedNumericString);

    return parseFloat(numericString);
  } catch {
    return NaN;
  }
};

// Need this to pick a memoize key when calling getLocaleDecimalSeparator(),
// else calling without argument will always return first locale's separator
const languageKey = (locale = i18n.language) => locale;

const getLocaleDecimalSeparator = memoizeWith(
  languageKey,
  (locale = i18n.language) => formatNumber(1.1, locale)[1]
);

export {
  retrieveTranslation,
  getMultiLangValue,
  getLanguageOrCountryIcon,
  getLanguageOfLangtag,
  getTableDisplayName,
  getColumnDisplayName,
  getCountryOfLangtag,
  getCurrencyCode,
  getFallbackCurrencyValue,
  tests,
  isMultiLanguage,
  isMultiCountry,
  formatDate,
  formatTime,
  formatTimeShort,
  formatDateTime,
  formatNumber,
  toPlainDate,
  getLocaleDecimalSeparator,
  readLocalizedNumber,
  isLangtag,
  isCountryTag
};
