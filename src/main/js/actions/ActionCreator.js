const Dispatcher = require("../dispatcher/Dispatcher");
const ActionTypes = require("../constants/TableauxConstants").ActionTypes;
import Raven from "raven-js";

module.exports = {

  changeCell: function (cell, newValue, cb) {
    Dispatcher.trigger(ActionTypes.CHANGE_CELL, {
      cell,
      value: newValue,
      cb
    });
  },

  removeRow: function (tableId, rowId) {
    Dispatcher.trigger(ActionTypes.REMOVE_ROW, {
      tableId: tableId,
      rowId: rowId
    });
  },

  addRow: function (tableId, cb) {
    Dispatcher.trigger(ActionTypes.CREATE_ROW, {
      tableId,
      cb
    });
  },

    // An event just for ShortTextEditCell to create a new Row when last is editing
  addRowOrSelectNextCell: function () {
    Dispatcher.trigger(ActionTypes.CREATE_ROW_OR_SELECT_NEXT_CELL);
  },

  switchView: function (viewName, params) {
    Dispatcher.trigger(ActionTypes.SWITCH_VIEW, {
      viewName: viewName,
      params: params
    });
  },

  switchFolder: function (folderId, langtag) {
    Dispatcher.trigger(ActionTypes.SWITCH_FOLDER, {
      id: folderId,
      langtag: langtag
    });
  },

  switchTable: function (tableId, langtag) {
    Dispatcher.trigger(ActionTypes.SWITCH_TABLE, {
      id: tableId,
      langtag: langtag
    });
  },

  switchLanguage: function (langtag) {
    Dispatcher.trigger(ActionTypes.SWITCH_LANGUAGE, {
      langtag: langtag
    });
  },

  openOverlay: function (overlayContent) {
    const {context, title} = (overlayContent.head.props || {});
    Raven.captureBreadcrumb({
      message: "open overlay: " + context + " of " + title,
      data: {
        context: context,
        title: title
      }
    });
    Dispatcher.trigger(ActionTypes.OPEN_OVERLAY, overlayContent);
  },

  closeOverlay: function (name = null) {
    Raven.captureBreadcrumb({
      message: "CloseOverlay"
    });
    Dispatcher.trigger(ActionTypes.CLOSE_OVERLAY, name);
  },

  enableShouldCellFocus: function () {
    Dispatcher.trigger(ActionTypes.ENABLE_SHOULD_CELL_FOCUS);
  },

  disableShouldCellFocus: function () {
    Dispatcher.trigger(ActionTypes.DISABLE_SHOULD_CELL_FOCUS);
  },

  toggleRowExpand: function (rowId) {
    Dispatcher.trigger(ActionTypes.TOGGLE_ROW_EXPAND, {
      rowId
    });
  },

  toggleCellEditing: function ({editing = true, langtag}) {
    Dispatcher.trigger(ActionTypes.TOGGLE_CELL_EDITING, {
      editing,
      langtag
    });
  },

  toggleCellSelection: function (cell, selected, langtag) {
    Dispatcher.trigger(ActionTypes.TOGGLE_CELL_SELECTION, {
      cell: cell,
      selected: selected,
      langtag: langtag
    });
  },

  selectNextCell: function (direction) {
    Dispatcher.trigger(ActionTypes.SELECT_NEXT_CELL,
        direction
      );
  },

  cleanupTable: function (tableId) {
    Dispatcher.trigger(ActionTypes.CLEANUP_TABLE, {
      tableId: tableId
    });
  },

  cleanupTableDone: function (tableId) {
    Dispatcher.trigger(ActionTypes.CLEANUP_TABLE_DONE, {
      tableId: tableId
    });
  },

  addFolder: function (name, description, parentId, onError) {
    Dispatcher.trigger(ActionTypes.ADD_FOLDER, {
      name: name,
      description: description,
      parentId: parentId,
      onError: onError
    });
  },

  changeFolder: function (folderId, name, description, parentId, onError) {
    Dispatcher.trigger(ActionTypes.CHANGE_FOLDER, {
      folderId: folderId,
      name: name,
      description: description,
      parentId: parentId,
      onError: onError
    });
  },

  removeFolder: function (folderId) {
    Dispatcher.trigger(ActionTypes.REMOVE_FOLDER, {
      folderId: folderId
    });
  },

  addFile: function (uuid, title, description, externalName, internalName, mimeType, folderId, fileUrl) {
    Dispatcher.trigger(ActionTypes.ADD_FILE, {
      uuid: uuid,
      title: title,
      description: description,
      externalName: externalName,
      internalName: internalName,
      mimeType: mimeType,
      folderId: folderId,
      fileUrl: fileUrl
    });
  },

  changeFile: function (uuid, title, description, externalName, internalName, mimeType, folderId, fileUrl) {
    Dispatcher.trigger(ActionTypes.CHANGE_FILE, {
      uuid: uuid,
      title: title,
      description: description,
      externalName: externalName,
      internalName: internalName,
      mimeType: mimeType,
      folderId: folderId,
      fileUrl: fileUrl
    });
  },

  changedFileData: function (uuid, title, description, externalName, internalName, mimeType, folderId, fileUrl) {
    Dispatcher.trigger(ActionTypes.CHANGED_FILE_DATA, {
      uuid: uuid,
      title: title,
      description: description,
      externalName: externalName,
      internalName: internalName,
      mimeType: mimeType,
      folderId: folderId,
      fileUrl: fileUrl
    });
  },

  removeFile: function (fileId) {
    Dispatcher.trigger(ActionTypes.REMOVE_FILE, {
      fileId: fileId
    });
  },

  closeOverlayTypeText: function () {
    Dispatcher.trigger(ActionTypes.OVERLAY_TYPE_TEXT_CLOSE);
  },

  saveOverlayTypeText: function () {
    Dispatcher.trigger(ActionTypes.OVERLAY_TYPE_TEXT_SAVE);
  },

  changeRowFilters: function (filters, sorting) {
    Dispatcher.trigger(ActionTypes.CHANGE_FILTER, {filters, sorting});
  },

  clearFilter: function () {
    Dispatcher.trigger(ActionTypes.CLEAR_FILTER);
  },

  spinnerOn: function () {
    Dispatcher.trigger(ActionTypes.SPINNER_ON);
  },

  spinnerOff: function () {
    Dispatcher.trigger(ActionTypes.SPINNER_OFF);
  },

  showRowContextMenu: function (row, langtag, x, y, table, cell) {
    Dispatcher.trigger(ActionTypes.SHOW_ROW_CONTEXT_MENU,
      {
        x,
        y,
        row,
        langtag,
        table,
        cell
      });
  },

  closeRowContextMenu: function () {
    Dispatcher.trigger(ActionTypes.CLOSE_ROW_CONTEXT_MENU);
  },

  duplicateRow: function (tableId, rowId) {
    Dispatcher.trigger(ActionTypes.DUPLICATE_ROW,
      {
        tableId,
        rowId
      });
  },

  showToast: function (content, milliseconds) {
    Dispatcher.trigger(ActionTypes.SHOW_TOAST,
      {
        content,
        milliseconds
      });
  },

  editColumnHeaderDone: (colId, langtag, newName, newDescription) => {
    Dispatcher.trigger(ActionTypes.DONE_EDIT_HEADER, {
      colId,
      langtag,
      newName,
      newDescription
    }
    );
  },

  refreshTableNames: () => {
    Dispatcher.trigger(
      ActionTypes.REFRESH_TABLE_NAMES, {}
    );
  },

  setColumnsVisibility: (to, cols, cb) => {
    Dispatcher.trigger(ActionTypes.SET_COLUMNS_VISIBILITY, {coll: cols, val: to, cb: cb});
  },

  jumpSpinnerOn: function () {
    Dispatcher.trigger(ActionTypes.JUMP_SPINNER_ON, {});
  },

  jumpSpinnerOff: function () {
    Dispatcher.trigger(ActionTypes.JUMP_SPINNER_OFF, {});
  },

  resetTableURL: function () {
    Dispatcher.trigger(ActionTypes.RESET_TABLE_URL, {});
  },

  copyCellContent: (cell, langtag) => {
    Dispatcher.trigger(ActionTypes.COPY_CELL_CONTENT, {cell, langtag});
  },

  pasteCellContent: (targetCell, langtag) => {
    Dispatcher.trigger(ActionTypes.PASTE_CELL_CONTENT, {cell: targetCell, langtag});
  },

  switchEntityViewLanguage: ({langtag}) => {
    Dispatcher.trigger(ActionTypes.SWITCH_ENTITY_VIEW_LANGUAGE, {langtag});
  },

  filterLinksInOverlay: ({filterMode, filterValue}) => {
    Dispatcher.trigger(ActionTypes.FILTER_LINKS, {filterMode, filterValue});
  },

  broadcastRowLoaded: ({id, row}) => {
    Dispatcher.trigger(ActionTypes.ENTITY_VIEW_ROW_LOADED, {id, row});
  },

  setTranslationView: (translationInfo) => {
    Dispatcher.trigger(ActionTypes.SET_TRANSLATION_VIEW, translationInfo);
  },

  filterEntityView: (payload) => {
    Dispatcher.trigger(ActionTypes.FILTER_ENTITY_VIEW, payload);
  },

  passOnKeyStrokes: (payload) => {
    Dispatcher.trigger(ActionTypes.PASS_ON_KEYSTROKES, payload);
  },

  changeEntityViewRow: (payload) => {
    Dispatcher.trigger(ActionTypes.CHANGE_ENTITY_VIEW_ROW, payload);
  },

  changeHeaderTitle: (payload) => {
    Dispatcher.trigger(ActionTypes.CHANGE_HEADER_TITLE, payload);
  },

  updateOverlay: ({id, props}) => {
    Dispatcher.trigger(ActionTypes.UPDATE_OVERLAY, {id, props});
  },

  broadcastDataChange: (payload) => {
//    console.log("Data changed in", `table${payload.cell.tableId}, ${payload.cell.id}`);
    Dispatcher.trigger(ActionTypes.BROADCAST_DATA_CHANGE, payload);
  },

  broadcastConnectionStatus: (payload) => {
    Dispatcher.trigger(ActionTypes.CONNECTION_STATUS_CHANGED, payload);
  },

  openAnnotationsPopup: (cell = {}) => {
    Dispatcher.trigger(ActionTypes.OPEN_ANNOTATIONS_VIEWER, {cellId: cell.id, rowId: (cell.row || {}).id});
  },

  closeAnnotationsPopup: () => {
    Dispatcher.trigger(ActionTypes.CLOSE_ANNOTATIONS_VIEWER);
  }
};
