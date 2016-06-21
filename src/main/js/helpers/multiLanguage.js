import TableauxConstants from '../constants/TableauxConstants';
import React from 'react';
import _  from 'lodash';

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
    throw "json is not a plain object"
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
  //we try to split on "-" (dash) character
  const langtagSplitted = langtag.split(/-|_/);
  let icon, countryOrLanguage, country, language = langtagSplitted[0];

  //hey, we got a full langtag, e.g. de-CH
  if (langtagSplitted.length > 1) {
    country = langtagSplitted[1];
  }
  countryOrLanguage = country ? country.toLowerCase() : language.toLowerCase();
  icon = countryOrLanguage + ".png";

  return (
    <span className="langtag">
      <img src={"/img/flags/" + icon} alt={countryOrLanguage}/><span
      className="langtag-label">{countryOrLanguage}</span>
    </span>
  );
}

function getLanguageOfLangtag(langtag) {
  return langtag.split(/-|_/)[0];
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
  retrieveTranslation : function (defaultLanguage) {
    return function (json, language) {
      return retrieveTranslation(json, language, defaultLanguage)
    }
  },
  getLanguageOrCountryIcon,
  getLanguageOfLangtag
};