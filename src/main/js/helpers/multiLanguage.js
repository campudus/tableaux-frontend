var _ = require('lodash');

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

  var content = json[language];

  if (typeof defaultLanguage !== "undefined" && defaultLanguage !== language) {
    // fallback to default language if no or empty translation found
    if (typeof content === "undefined" || content === null || content === "") {
      content = json[defaultLanguage];
    }
  }

  return content;
}

/**
 * Maps 'de' to 'de-DE' or 'en-us' to 'en-GB'.
 * If map is not possible than return first of langtags
 * @param locale
 * @param langtags
 */
function mapLocaleToLangtag(locale, langtags) {
  if (typeof langtags === "undefined") {
    throw "you need to define langtags"
  }

  var find = function (_locale) {
    return function (tag) {
      return tag.indexOf(_locale) !== -1;
    }
  };

  var langtag = _.find(langtags, find(locale));
  if (!langtag) {
    if (locale.indexOf("-") !== -1) {
      locale = locale.split("-")[0];
      langtag = _.find(langtags, find(locale));
    }

    if (!langtag) {
      langtag = langtags[0];
    }
  }

  return langtag;
}

/**
 * example usage:
 * var multiLanguage = require('./multiLanguage.js')
 * // define default language
 * var retrieveTranslation = multilanguage.retrieveTranslation('de_DE')
 *
 * var json = {
 *  "de_DE" : "Deutscher Inhalt",
 *  "en_GB" : null // no english value
 * }
 * var translation = retrieveTranslation(json, "en_GB")
 * // will print "Deutscher Inhalt" b/c of default language
 * Console.println(translation);
 */
module.exports = {
  retrieveTranslation : function (defaultLanguage) {
    return function (json, language) {
      return retrieveTranslation(json, language, defaultLanguage)
    }
  },

  mapLocaleToLangtag : function (langtags) {
    return function (locale) {
      return mapLocaleToLangtag(locale, langtags)
    }
  }
};