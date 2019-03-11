var keyMirror = require("keymirror");

/*
 * Order is important.
 * First language is default language.
 * Also, this is the order an expanded row shows the languages
 */
let languagetags;

const grudConstants = {
  Directions: keyMirror({
    DOWN: null,
    RIGHT: null,
    LEFT: null,
    UP: null
  }),

  // Lowercase on purpose. Reflects exact API naming
  ColumnKinds: keyMirror({
    shorttext: null,
    richtext: null,
    text: null,
    link: null,
    numeric: null,
    boolean: null,
    concat: null,
    attachment: null,
    datetime: null,
    currency: null,
    date: null,
    group: null
  }),

  LanguageType: keyMirror({
    country: null
  }),

  ViewNames: keyMirror({
    TABLE_VIEW: null,
    MEDIA_VIEW: null,
    DASHBOARD_VIEW: null
  }),

  Alignments: keyMirror({
    UPPER_LEFT: null,
    UPPER_RIGHT: null,
    LOWER_LEFT: null,
    LOWER_RIGHT: null
  }),

  DateTimeFormats: {
    formatForServer: "YYYY-MM-DDTHH:mm:ss.SSSZ",
    formatForUser: "DD.MM.YYYY - HH:mm"
  },

  DateFormats: {
    formatForServer: "YYYY-MM-DD",
    formatForUser: "DD.MM.YYYY"
  },

  // Fixed pixel height of a single row including border
  RowHeight: 46,

  PageTitle: "GRUD",

  get Langtags() {
    return languagetags || null;
  },

  get DefaultLangtag() {
    return languagetags ? languagetags[0] : null;
  },

  // we hardcode this because english is the world language
  FallbackLanguage: "en",

  initLangtags: langtags => {
    languagetags = langtags;
  },

  SortValues: keyMirror({
    ASC: null,
    DESC: null
  }),

  FilterModes: keyMirror({
    CONTAINS: null,
    STARTS_WITH: null,
    ID_ONLY: null,
    UNTRANSLATED: null,
    ANY_UNTRANSLATED: null,
    FINAL: null,
    IMPORTANT: null,
    CHECK_ME: null,
    POSTPONE: null,
    WITH_COMMENT: null,
    ROW_CONTAINS: null,
    TRANSLATOR_FILTER: null
  })
};

module.exports = grudConstants;
