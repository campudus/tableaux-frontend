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
    Dispatcher.trigger(ActionTypes.CREATE_ROW, {
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

  switchedTable : function (tableId) {
    Dispatcher.trigger(ActionTypes.SWITCHED_TABLE, {
      tableId : tableId
    });
  },

  switchLanguage : function (langtag) {
    Dispatcher.trigger(ActionTypes.SWITCH_LANGUAGE, {
      langtag : langtag
    });
  },

  openOverlay : function (overlayContent) {
    Dispatcher.trigger(ActionTypes.OPEN_OVERLAY, overlayContent);
  },

  closeOverlay : function () {
    Dispatcher.trigger(ActionTypes.CLOSE_OVERLAY);
  },

  enableShouldCellFocus : function () {
    Dispatcher.trigger(ActionTypes.ENABLE_SHOULD_CELL_FOCUS);
  },

  disableShouldCellFocus : function () {
    Dispatcher.trigger(ActionTypes.DISABLE_SHOULD_CELL_FOCUS);
  },

  toggleRowExpand : function (row) {
    Dispatcher.trigger(ActionTypes.TOGGLE_ROW_EXPAND, {
      row : row
    });
  },

  addFolder : function (name, description, parentId) {
    Dispatcher.trigger(ActionTypes.ADD_FOLDER, {
      name : name,
      description : description,
      parentId : parentId
    });
  },

  changeFolder : function (folderId, name, description, parentId) {
    Dispatcher.trigger(ActionTypes.CHANGE_FOLDER, {
      folderId : folderId,
      name : name,
      description : description,
      parentId : parentId
    });
  },

  removeFolder : function (folderId) {
    Dispatcher.trigger(ActionTypes.REMOVE_FOLDER, {
      folderId : folderId
    });
  },

  addFile : function (uuid, title, description, externalName, internalName, mimeType, folderId, fileUrl) {
    Dispatcher.trigger(ActionTypes.ADD_FILE, {
      uuid : uuid,
      title : title,
      description : description,
      externalName : externalName,
      internalName : internalName,
      mimeType : mimeType,
      folderId : folderId,
      fileUrl : fileUrl
    });
  },

  changeFile : function (uuid, title, description, externalName, internalName, mimeType, folderId, fileUrl) {
    Dispatcher.trigger(ActionTypes.CHANGE_FILE, {
      uuid : uuid,
      title : title,
      description : description,
      externalName : externalName,
      internalName : internalName,
      mimeType : mimeType,
      folderId : folderId,
      fileUrl : fileUrl
    });
  },

  changedFileData : function (uuid, title, description, externalName, internalName, mimeType, folderId, fileUrl) {
    Dispatcher.trigger(ActionTypes.CHANGED_FILE_DATA, {
      uuid : uuid,
      title : title,
      description : description,
      externalName : externalName,
      internalName : internalName,
      mimeType : mimeType,
      folderId : folderId,
      fileUrl : fileUrl
    });
  },

  removeFile : function (fileId) {
    Dispatcher.trigger(ActionTypes.REMOVE_FILE, {
      fileId : fileId
    });
  }
};