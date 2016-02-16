var keyMirror = require('keymirror');

var languagetag = {
  DE_DE : "de-DE",
  EN_GB : "en-GB",
  FR_FR : "fr-FR"
};

var TableauxConstant = {
  ActionTypes : keyMirror({
    SWITCH_VIEW : null,
    SWITCH_FOLDER : null,

    SWITCH_TABLE : null,
    SWITCHED_TABLE : null,
    SWITCH_LANGUAGE : null,

    //Generic Overlay events
    OPEN_OVERLAY : null,
    CLOSE_OVERLAY : null,

    CHANGE_CELL : null,

    REMOVE_ROW : null,
    CREATE_ROW : null,
    TOGGLE_ROW_EXPAND : null,

    CREATE_ROW_OR_SELECT_NEXT_CELL : null,

    TOGGLE_CELL_SELECTION : null,
    TOGGLE_CELL_EDITING : null,
    SELECT_NEXT_CELL : null,

    DISABLE_SHOULD_CELL_FOCUS : null,
    ENABLE_SHOULD_CELL_FOCUS : null,

    ADD_FOLDER : null,
    CHANGE_FOLDER : null,
    REMOVE_FOLDER : null,

    ADD_FILE : null,
    CHANGE_FILE : null,
    CHANGED_FILE_DATA : null,
    REMOVE_FILE : null,

    CLEANUP_TABLE : null,
    CLEANUP_TABLE_DONE : null,

    //Overlay Text Type
    OVERLAY_TYPE_TEXT_CLOSE : null,
    OVERLAY_TYPE_TEXT_SAVE : null

  }),

  Directions : keyMirror({
    DOWN : null,
    RIGHT : null,
    LEFT : null,
    UP : null
  }),

  //Lowercase on purpose. Reflects exact API naming
  ColumnKinds : keyMirror({
    shorttext : null,
    richtext : null,
    text : null,
    link : null,
    numeric : null,
    boolean : null,
    concat : null,
    attachment : null,
    datetime : null
  }),

  ViewNames : keyMirror({
    'TABLE_VIEW' : null,
    'MEDIA_VIEW' : null
  }),

  Langtags : languagetag,

  DefaultLangtag : languagetag.DE_DE,

  DateTimeFormats : {
    formatForServer : "YYYY-MM-DDTHH:mm:SS.SSSZ",
    formatForUser : "DD.MM.YYYY - HH:mm"
  }

};

module.exports = TableauxConstant;
