var keyMirror = require("keymirror");

/*
 * Order is important.
 * First language is default language.
 * Also, this is the order an expanded row shows the languages
 */
let languagetags;
let _config = {};

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
    group: null,
    integer: null,
    status: null
  }),

  ImmutableColumnKinds: ["status", "concat"],

  LanguageType: keyMirror({
    country: null,
    language: null
  }),

  ViewNames: keyMirror({
    TABLE_VIEW: null,
    MEDIA_VIEW: null,
    DASHBOARD_VIEW: null,
    FRONTEND_SERVICE_VIEW: null,
    TAXONOMY_DASHBOARD_VIEW: null,
    PROFILE_VIEW: null
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

  // This is a meta column which doesn't exist in (or is not provided by) the backend
  // but is needed for sorting in the frontend
  RowIdColumn: {
    id: -1,
    ordering: -1,
    displayName: { de: "ID" },
    identifier: false,
    kind: "numeric",
    multilanguage: false,
    name: "rowId",
    separator: false
  },

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
    ANY_UNTRANSLATED: null,
    CHECK_ME: null,
    CONTAINS: null,
    FINAL: null,
    ID_ONLY: null,
    IS_EMPTY: null,
    IMPORTANT: null,
    POSTPONE: null,
    ROW_CONTAINS: null,
    STARTS_WITH: null,
    STATUS: null,
    TRANSLATOR_FILTER: null,
    UNTRANSLATED: null,
    WITH_COMMENT: null
  }),

  get config() {
    return _config;
  },

  initConfig: config => (_config = config)
};

module.exports = grudConstants;
