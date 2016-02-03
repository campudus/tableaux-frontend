var keyMirror = require('keymirror');

var languagetag = {
  DE_DE : "de-DE",
  EN_GB : "en-GB",
  FR_FR : "fr-FR"
};

var TableauxConstant = {
  ActionTypes : keyMirror({
    SWITCH_TABLE : null,
    SWITCHED_TABLE : null,
    SWITCH_LANGUAGE : null,

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
    ENABLE_SHOULD_CELL_FOCUS : null
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
    concat : null
  }),

  Langtags : languagetag,

  DefaultLangtag : languagetag.DE_DE,

  DateTimeFormats : {
    formatForServer : "YYYY-MM-DDTHH:mm:SS.SSSZ",
    formatForUser : "DD.MM.YYYY - HH:mm"
  }

};

module.exports = TableauxConstant;
