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
    this.disableShouldCellFocus();
    Dispatcher.trigger(ActionTypes.OPEN_OVERLAY, overlayContent);
  },

  closeOverlay : function () {
    this.enableShouldCellFocus();
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

  toggleCellEditing : function (editing) {
    if (editing === undefined) {
      editing = true;
    }
    Dispatcher.trigger(ActionTypes.TOGGLE_CELL_EDITING, {
      editing : editing
    });
  },

  toggleCellSelection : function (cell, selected, langtag) {
    Dispatcher.trigger(ActionTypes.TOGGLE_CELL_SELECTION, {
      cell : cell,
      selected : selected,
      langtag : langtag
    });
  },

  selectNextCell : function (direction) {
    Dispatcher.trigger(ActionTypes.SELECT_NEXT_CELL,
      direction
    );
  },

  cleanupTable : function (tableId) {
    Dispatcher.trigger(ActionTypes.CLEANUP_TABLE, {
      tableId : tableId
    })
  },

  cleanupTableDone : function (tableId) {
    Dispatcher.trigger(ActionTypes.CLEANUP_TABLE_DONE, {
      tableId : tableId
    })
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
  },

  closeOverlayTypeText:function(){
    Dispatcher.trigger(ActionTypes.OVERLAY_TYPE_TEXT_CLOSE);
  },

  saveOverlayTypeText:function(){
    Dispatcher.trigger(ActionTypes.OVERLAY_TYPE_TEXT_SAVE);
  }


};