var keyMirror = require('keymirror');

module.exports = {

  ActionTypes : keyMirror({

    CHANGE_CELL : null,

    REMOVE_ROW : null,
    ADD_ROW : null,

    SWITCH_TABLE : null,
    SWITCH_LANGUAGE : null,

    OPEN_OVERLAY : null,
    CLOSE_OVERLAY : null,

    CREATE_ROW_OR_SELECT_NEXT_CELL : null

  })

};