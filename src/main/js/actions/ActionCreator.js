var Dispatcher = require('../dispatcher/Dispatcher');
var ActionTypes = require('../constants/TableauxConstants').ActionTypes;

module.exports = {

  changeCell : function (cell, newValue) {
    Dispatcher.trigger(ActionTypes.CHANGE_CELL, {
      cell : cell,
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

  switchView : function (viewName, params) {
    Dispatcher.trigger(ActionTypes.SWITCH_VIEW, {
      viewName : viewName,
      params : params
    });
  },

  switchFolder : function (folderId, langtag) {
    Dispatcher.trigger(ActionTypes.SWITCH_FOLDER, {
      id : folderId,
      langtag : langtag
    });
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
  },

  openOverlay : function (overlayContent) {
    console.log("+ calling openOverlay");
    Dispatcher.trigger(ActionTypes.OPEN_OVERLAY, overlayContent);
  },

  closeOverlay : function () {
    console.log("- calling closeOverlay");
    Dispatcher.trigger(ActionTypes.CLOSE_OVERLAY);
  },

  enableShouldCellFocus : function () {
    Dispatcher.trigger(ActionTypes.ENABLE_SHOULD_CELL_FOCUS);
  },

  disableShouldCellFocus : function () {
    Dispatcher.trigger(ActionTypes.DISABLE_SHOULD_CELL_FOCUS);
  },

  toggleRowExpand : function (rowId) {
    Dispatcher.trigger(ActionTypes.TOGGLE_ROW_EXPAND, {
      rowId
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

  addFolder : function (name, description, parentId, onError) {
    Dispatcher.trigger(ActionTypes.ADD_FOLDER, {
      name : name,
      description : description,
      parentId : parentId,
      onError: onError
    });
  },

  changeFolder : function (folderId, name, description, parentId, onError) {
    Dispatcher.trigger(ActionTypes.CHANGE_FOLDER, {
      folderId : folderId,
      name : name,
      description : description,
      parentId : parentId,
      onError: onError
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

  closeOverlayTypeText : function () {
    Dispatcher.trigger(ActionTypes.OVERLAY_TYPE_TEXT_CLOSE);
  },

  saveOverlayTypeText : function () {
    Dispatcher.trigger(ActionTypes.OVERLAY_TYPE_TEXT_SAVE);
  },

  changeFilter : function (newFilterColumnId, newFilterValue, newSortColumnId, newSortValue) {
    Dispatcher.trigger(ActionTypes.CHANGE_FILTER, {
      filterColumnId : newFilterColumnId,
      filterValue : newFilterValue,
      sortColumnId : newSortColumnId,
      sortValue : newSortValue
    });
  },

  clearFilter : function () {
    Dispatcher.trigger(ActionTypes.CLEAR_FILTER);
  },

  spinnerOn : function () {
    Dispatcher.trigger(ActionTypes.SPINNER_ON);
  },

  spinnerOff : function () {
    Dispatcher.trigger(ActionTypes.SPINNER_OFF);
  },

  showRowContextMenu : function (row, langtag, x, y, table) {
    Dispatcher.trigger(ActionTypes.SHOW_ROW_CONTEXT_MENU, {x, y, row, langtag, table});
  },

  closeRowContextMenu : function () {
    Dispatcher.trigger(ActionTypes.CLOSE_ROW_CONTEXT_MENU);
  },

  duplicateRow : function (tableId, rowId) {
    Dispatcher.trigger(ActionTypes.DUPLICATE_ROW, {tableId, rowId});
  },

  showToast : function (content, milliseconds) {
    Dispatcher.trigger(ActionTypes.SHOW_TOAST, {content, milliseconds});
  },

  editColumnHeaderDone: (colId, langtag, newName, newDescription) => {
    Dispatcher.trigger(
        ActionTypes.DONE_EDIT_HEADER,
        {colId, langtag, newName, newDescription}
    )
  },

};