var Dispatcher = require('../dispatcher/Dispatcher');
var ActionTypes = require('../constants/TableauxConstants').ActionTypes;

module.exports = {

  changeCell : function (tableId, rowId, cellId, newValue) {

    Dispatcher.trigger(ActionTypes.CHANGE_CELL, {
      tableId : tableId,
      rowId : rowId,
      cellId : cellId,
      value : newValue
    });

  },

  removeRow : function (tableId, rowId) {

    Dispatcher.trigger(ActionTypes.REMOVE_ROW, {
      tableId : tableId,
      rowId : rowId
    });

  },

  addRow : function (tableId) {

    Dispatcher.trigger(ActionTypes.ADD_ROW, {
      tableId : tableId
    });

  },

  //An event just for ShortTextEditCell to create a new Row when last is editing
  addRowOrSelectNextCell : function () {
    Dispatcher.trigger(ActionTypes.CREATE_ROW_OR_SELECT_NEXT_CELL);
  },

  switchTable : function (tableId, langtag) {
    Dispatcher.trigger(ActionTypes.SWITCH_TABLE, {
      id : tableId,
      langtag : langtag
    });
  },

  switchLanguage : function (langtag) {

    Dispatcher.trigger(ActionTypes.SWITCH_LANGUAGE, {
      langtag : langtag
    });

  }

};