var keyMirror = require("keymirror");

/*
 * Order is important.
 * First language is default language.
 * Also, this is the order a expanded row shows the languages
 * */
var languagetags;

var TableauxConstant = {
  ActionTypes: keyMirror({
    SWITCH_VIEW: null,
    SWITCH_FOLDER: null,

    SWITCH_TABLE: null,
    SWITCHED_TABLE: null,
    SWITCH_LANGUAGE: null,

    // Generic Overlay events
    OPEN_OVERLAY: null,
    CLOSE_OVERLAY: null,

    CHANGE_CELL: null,

    REMOVE_ROW: null,
    CREATE_ROW: null,
    TOGGLE_ROW_EXPAND: null,
    DUPLICATE_ROW: null,

    CREATE_ROW_OR_SELECT_NEXT_CELL: null,

    TOGGLE_CELL_SELECTION: null,
    TOGGLE_CELL_EDITING: null,
    SELECT_NEXT_CELL: null,

    DISABLE_SHOULD_CELL_FOCUS: null,
    ENABLE_SHOULD_CELL_FOCUS: null,

    ADD_FOLDER: null,
    CHANGE_FOLDER: null,
    REMOVE_FOLDER: null,

    ADD_FILE: null,
    CHANGE_FILE: null,
    CHANGED_FILE_DATA: null,
    REMOVE_FILE: null,

    CLEANUP_TABLE: null,
    CLEANUP_TABLE_DONE: null,

    // Overlay Text Type
    OVERLAY_TYPE_TEXT_CLOSE: null,
    OVERLAY_TYPE_TEXT_SAVE: null,

    // Filter
    CHANGE_FILTER: null,
    CLEAR_FILTER: null,

    // Spinner
    SPINNER_ON: null,
    SPINNER_OFF: null,

    // Jump-to-cell spinner
    JUMP_SPINNER_ON: null,
    JUMP_SPINNER_OFF: null,

    RESET_TABLE_URL: null,

    // Context Menu
    SHOW_ROW_CONTEXT_MENU: null,
    CLOSE_ROW_CONTEXT_MENU: null,

    // Toast
    SHOW_TOAST: null,

    // Access Rights
    NO_PERMISSION_SAVE_LANGUAGE: null,

    // Column modification
    DONE_EDIT_HEADER: null,
    REFRESH_TABLE_NAMES: null,

    // Column visibility filtering
    SET_COLUMNS_VISIBILITY: null,

    COPY_CELL_CONTENT: null,
    PASTE_CELL_CONTENT: null,

    SWITCH_ENTITY_VIEW_LANGUAGE: null,
    FILTER_LINKS: null
  }),

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
    date: null
  }),

  LanguageType: keyMirror({
    country: null
  }),

  ViewNames: keyMirror({
    "TABLE_VIEW": null,
    "MEDIA_VIEW": null
  }),

  Alignments: keyMirror({
    "UPPER_LEFT": null,
    "UPPER_RIGHT": null,
    "LOWER_LEFT": null,
    "LOWER_RIGHT": null
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

  PageTitle: "DataCenter",

  get Langtags() {
    return languagetags || null;
  },

  get DefaultLangtag() {
    return languagetags ? languagetags[0] : null;
  },

  // we hardcode this because english is the world language
  FallbackLanguage: "en",

  initLangtags: (langtags) => {
    languagetags = langtags;
  },

  SortValues: keyMirror({
    ASC: null,
    DESC: null
  }),

  FilterModes: keyMirror(
    {
      CONTAINS: null,
      STARTS_WITH: null,
      ID_ONLY: null,
      UNTRANSLATED: null,
      ANY_UNTRANSLATED: null,
      FINAL: null
    }
  )
};

module.exports = TableauxConstant;
