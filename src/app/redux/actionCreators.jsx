import i18n from "i18next";
import f from "lodash/fp";
import { ShowArchived } from "../archivedRows/helpers";
import { loadAndOpenEntityView } from "../components/overlay/EntityViewOverlay";
import { Langtags, SortValue } from "../constants/TableauxConstants";
import { makeRequest } from "../helpers/apiHelper";
import API_ROUTES from "../helpers/apiRoutes";
import { urlToTableDestination } from "../helpers/apiUrl";
import { doto, mapIndexed } from "../helpers/functools";
import { checkOrThrow } from "../specs/type";
import {
  addAnnotationLangtags,
  addTextAnnotation,
  removeAnnotationLangtags,
  removeTextAnnotation,
  setAllRowsFinal,
  toggleAnnotationFlag
} from "./actions/annotationActions";
import { changeCellValue, modifyHistory } from "./actions/cellActions";
import { queryFrontendServices } from "./actions/frontendServices";
import * as Row from "./actions/rowActions";
import * as MediaActions from "./actions/mediaActions";
import {
  deleteUserSettings,
  getUserSettings,
  upsertUserSetting
} from "./actions/userSettingActions";
import actionTypes from "./actionTypes";
import { overlayParamsSpec } from "./reducers/overlays";

const {
  getAllTables,
  getAllColumnsForTable,
  toRow,
  toColumn,
  toTable
} = API_ROUTES;

const {
  ADD_ROWS,
  ADDITIONAL_ROWS_DATA_LOADED,
  CLEAN_UP,
  COLUMNS_DATA_LOADED,
  COLUMNS_DATA_LOAD_ERROR,
  COLUMNS_LOADING_DATA,
  COLUMN_EDIT,
  COLUMN_EDIT_ERROR,
  COLUMN_EDIT_SUCCESS,
  DELETE_ROW,
  GENERATED_DISPLAY_VALUES,
  HIDE_ALL_COLUMNS,
  SET_COLUMNS_VISIBLE,
  SET_COLUMN_ORDERING,
  SET_COLUMN_WIDTHS,
  SET_CURRENT_LANGUAGE,
  SET_CURRENT_TABLE,
  SET_DISPLAY_VALUE_WORKER,
  SET_FILTERS_AND_SORTING,
  SET_STATUS_INFO,
  SET_USER_AUTHENTICATED,
  START_GENERATING_DISPLAY_VALUES,
  TABLE_DATA_LOADED,
  TABLE_DATA_LOAD_ERROR,
  TABLE_LOADING_DATA,
  TABLE_NAME_EDIT,
  TABLE_NAME_EDIT_ERROR,
  TABLE_NAME_EDIT_SUCCESS,
  TOGGLE_COLUMN_VISIBILITY,
  SET_ANNOTATION_HIGHLIGHT
} = actionTypes;

const {
  COPY_CELL_VALUE_TO_CLIPBOARD,
  RERENDER_TABLE,
  SET_PREVENT_CELL_DESELECTION,
  TOGGLE_CELL_EDITING,
  TOGGLE_CELL_SELECTION,
  TOGGLE_EXPANDED_ROW
} = actionTypes.tableView;

const {
  CLOSE_OVERLAY,
  HIDE_TOAST,
  OPEN_OVERLAY,
  REMOVE_OVERLAY,
  SET_OVERLAY_STATE,
  SHOW_TOAST
} = actionTypes.overlays;

const MultiSelect = actionTypes.multiSelect;

const dispatchParamsSafelyFor = (requiredParamNames, actionType) => params => {
  requiredParamNames.forEach(name => {
    if (!Object.keys(params).includes(name)) {
      throw new Error(
        `Can not create action ${actionType}, input misses param ${name}: ${JSON.stringify(
          params
        )}`
      );
    }
  });
  return { ...params, type: actionType };
};

const dispatchParamsFor = actionType => dispatchParamsSafelyFor([], actionType);

const loadTables = () => {
  return {
    promise: makeRequest({ apiRoute: getAllTables(), method: "GET" }),
    actionTypes: [TABLE_LOADING_DATA, TABLE_DATA_LOADED, TABLE_DATA_LOAD_ERROR]
  };
};

const loadColumns = tableId => dispatch =>
  new Promise((resolve, reject) => {
    dispatch({
      promise: makeRequest({
        apiRoute: getAllColumnsForTable(tableId),
        method: "GET"
      }),
      actionTypes: [
        COLUMNS_LOADING_DATA,
        COLUMNS_DATA_LOADED,
        COLUMNS_DATA_LOAD_ERROR
      ],
      tableId,
      onSuccess: resolve,
      onError: reject
    });
  });

const addRows = (tableId, rows) => {
  return {
    type: "ADD_ROWS",
    tableId,
    rows
  };
};

const checkIfSelectedCellExists = (dispatch, tableId, state) => {
  const dispatchToast = content =>
    dispatch(
      showToast({
        content: <div id="cell-jump-toast">{content}</div>
      })
    );

  const notFound = (id, validId) => !f.eq(validId, id) && !f.isNil(id);

  const [selectedCell, rows, columns, table, visibleColumns] = f.props(
    [
      ["selectedCell", "selectedCell"],
      ["rows", tableId, "data"],
      ["columns", tableId, "data"],
      ["tables", "data", tableId],
      ["tableView", "visibleColumns"]
    ],
    state
  );

  const { rowId, columnId, langtag } = selectedCell;

  if (f.isNil(rowId) && f.isNil(columnId)) {
    return;
  }

  const containsId = id =>
    f.flow(f.map("id"), f.includes(id), exists => (exists ? id : false));

  const validRowId = containsId(rowId)(rows) || f.get([0, "id"], rows);
  const validColumnId =
    containsId(columnId)(columns) || f.get([0, "id"], columns);

  if (!f.includes(validColumnId, visibleColumns)) {
    dispatch(setColumnsVisible(f.concat(visibleColumns, [validColumnId])));
  }

  if (notFound(rowId, validRowId)) {
    dispatchToast(i18n.t("table:jump.no_such_row", { row: rowId }));
  }

  if (notFound(columnId, validColumnId)) {
    dispatchToast(i18n.t("table:jump.no_such_column", { col: columnId }));
  }

  dispatch(
    toggleCellSelection({
      tableId: table.id,
      columnId: validColumnId,
      rowId: validRowId,
      langtag
    })
  );
};

const loadAllRows = (tableId, ...params) => async (dispatch, getState) => {
  await Row.loadAllRows(tableId, ...params)(dispatch);
  checkIfSelectedCellExists(dispatch, tableId, getState());
};

const toggleColumnVisibility = columnId => (dispatch, getState) => {
  const state = getState();
  const toggleSingleColumn = columnId => {
    const visibleColumns = f.prop(["tableView", "visibleColumns"], state);
    return f.includes(columnId, visibleColumns)
      ? f.without([columnId], visibleColumns)
      : f.concat(visibleColumns, columnId);
  };
  const { currentTable } = state.tableView;
  const updated = toggleSingleColumn(columnId);
  dispatch(
    upsertUserSetting(
      { key: "visibleColumns", kind: "table", tableId: currentTable },
      { value: updated }
    )
  );
  dispatch({
    type: TOGGLE_COLUMN_VISIBILITY,
    visibleColumns: updated
  });
};

const cleanUp = () => (dispatch, getState) => {
  const tableId = f.get(["tableView", "currentTable"], getState());
  dispatch({
    type: CLEAN_UP,
    tableId
  });
};

const setColumnsVisible = columnIds => (dispatch, getState) => {
  dispatch({
    type: SET_COLUMNS_VISIBLE,
    columnIds
  });
  const state = getState();
  const tableId = f.get(["tableView", "currentTable"], state);
  dispatch(
    upsertUserSetting(
      { key: "visibleColumns", kind: "table", tableId },
      { value: columnIds }
    )
  );
};

const setColumnOrdering = columnIds => (dispatch, getState) => {
  dispatch({ type: SET_COLUMN_ORDERING, columnIds });
  const tableId = f.get(["tableView", "currentTable"], getState());
  dispatch(
    upsertUserSetting(
      { key: "columnOrdering", kind: "table", tableId },
      { value: columnIds }
    )
  );
};

const setColumnWidths = columnWidths => (dispatch, getState) => {
  dispatch({ type: SET_COLUMN_WIDTHS, columnWidths });
  const tableId = f.get(["tableView", "currentTable"], getState());
  dispatch(
    upsertUserSetting(
      { key: "columnWidths", kind: "table", tableId },
      { value: columnWidths }
    )
  );
};

const hideAllColumns = (tableId, columns) => dispatch => {
  dispatch({ type: HIDE_ALL_COLUMNS, tableId });
  // first/one column has to be always visible
  const columnIds = [f.get("id", f.head(columns))];
  dispatch(
    upsertUserSetting(
      { key: "visibleColumns", kind: "table", tableId },
      { value: columnIds }
    )
  );
};

const setCurrentTable = tableId => {
  return {
    type: SET_CURRENT_TABLE,
    tableId
  };
};

const generateDisplayValues = (rows, columns, tableId) => (
  dispatch,
  getState
) => {
  dispatch({ type: START_GENERATING_DISPLAY_VALUES });
  const {
    tableView: { worker }
  } = getState();
  worker.postMessage([rows, columns, Langtags, tableId]);
  worker.onmessage = e => {
    const returnedTableId = e.data[1];
    if (returnedTableId !== tableId) {
      return;
    }
    const displayValues = e.data[0];
    dispatch({
      type: GENERATED_DISPLAY_VALUES,
      displayValues
    });
  };
};

const loadCompleteTable = ({ tableId, selectedRowId }) => async dispatch => {
  dispatch(setCurrentTable(tableId));
  await dispatch(loadColumns(tableId));
  if (selectedRowId > 0) {
    dispatch(fetchSingleRow({ tableId, selectedRowId }));
  }
  dispatch(loadAllRows(tableId));
};

const applyUserSettings = tableId => (dispatch, getState) => {
  const kind = "table";
  const { userSettings } = getState();
  const userSettingsGlobal = f.get(["global"], userSettings);
  const userSettingsTable = f.getOr({}, ["table", tableId], userSettings);
  const {
    filterReset,
    columnsReset,
    sortingReset,
    sortingDesc,
    annotationReset
  } = userSettingsGlobal;
  const {
    visibleColumns = [],
    rowsFilter = {},
    columnOrdering = [],
    columnWidths = {},
    annotationHighlight = ""
  } = userSettingsTable;
  const { filters, sortColumnName, sortDirection } = rowsFilter;

  if (
    (filterReset && sortingReset && !f.isEmpty(rowsFilter)) ||
    (filterReset && f.isNil(sortColumnName) && f.isNil(sortDirection)) ||
    (sortingReset && f.isEmpty(filters))
  ) {
    dispatch(deleteUserSettings({ kind, tableId, key: "rowsFilter" }));
  } else if (
    (filterReset && !f.isEmpty(filters)) ||
    (sortingReset && (!f.isNil(sortColumnName) || !f.isNil(sortDirection)))
  ) {
    dispatch(
      upsertUserSetting(
        { kind, tableId, key: "rowsFilter" },
        {
          value: {
            ...rowsFilter,
            ...(filterReset && { filters: [] }),
            ...(sortingReset && { sortColumnName: null }),
            ...(sortingReset && { sortDirection: null })
          }
        }
      )
    );
  }

  if (sortingDesc && (sortColumnName !== "rowId" || sortDirection !== "desc")) {
    dispatch(
      upsertUserSetting(
        { kind, tableId, key: "rowsFilter" },
        { value: { filters, sortColumnName: "rowId", sortDirection: "desc" } }
      )
    );
  }

  if (columnsReset && !f.isEmpty(columnOrdering)) {
    dispatch(deleteUserSettings({ kind, tableId, key: "columnOrdering" }));
  }

  if (columnsReset && !f.isEmpty(columnWidths)) {
    dispatch(deleteUserSettings({ kind, tableId, key: "columnWidths" }));
  }

  if (columnsReset && !f.isEmpty(visibleColumns)) {
    dispatch(deleteUserSettings({ kind, tableId, key: "visibleColumns" }));
  }

  if (annotationReset && !f.isEmpty(annotationHighlight)) {
    dispatch(deleteUserSettings({ kind, tableId, key: "annotationHighlight" }));
  }
};

const loadTableView = (tableId, customFilters) => (dispatch, getState) => {
  const { userSettings, columns } = getState();
  const userSettingsTable = f.getOr({}, ["table", tableId], userSettings);
  const {
    visibleColumns = [],
    rowsFilter = {},
    columnOrdering = [],
    columnWidths = {},
    annotationHighlight = ""
  } = userSettingsTable;
  const { filters = [], sortColumnName, sortDirection } = rowsFilter;
  const colName = sortColumnName;
  const direction = sortDirection || SortValue.asc;
  const sorting = { colName, direction };
  const cols = f.get([tableId, "data"], columns) ?? [];
  const initVisibleColumns = f.map("id", cols);
  const initColumnOrdering = mapIndexed(({ id }, idx) => ({ id, idx }))(cols);

  dispatch({
    type: SET_FILTERS_AND_SORTING,
    filters: !f.isEmpty(customFilters) ? customFilters : filters,
    sorting: !f.isEmpty(colName) ? sorting : {}
  });

  dispatch({
    type: SET_COLUMN_ORDERING,
    columnIds: f.isEmpty(columnOrdering) ? initColumnOrdering : columnOrdering
  });
  dispatch({
    type: SET_COLUMNS_VISIBLE,
    columnIds: f.isEmpty(visibleColumns) ? initVisibleColumns : visibleColumns
  });
  dispatch({
    type: SET_COLUMN_WIDTHS,
    columnWidths: columnWidths
  });
  dispatch({
    type: SET_ANNOTATION_HIGHLIGHT,
    annotationHighlight: annotationHighlight
  });
};

const setCurrentLanguage = lang => {
  return {
    type: SET_CURRENT_LANGUAGE,
    lang
  };
};

const showToast = data => {
  return f.isEmpty(data)
    ? { type: "NOTHING_TO_DO" }
    : {
        type: SHOW_TOAST,
        content: data.content,
        duration: data.duration || 2700
      };
};

const hideToast = () => ({ type: HIDE_TOAST });

const openOverlay = payload => {
  checkOrThrow(overlayParamsSpec, payload);
  return { payload, type: OPEN_OVERLAY };
};

const closeOverlayWithAnimation = ({
  overlayId,
  closingAnimationDuration
}) => ({
  promise: new Promise(resolve =>
    setTimeout(resolve, closingAnimationDuration)
  ),
  actionTypes: [CLOSE_OVERLAY, REMOVE_OVERLAY, "IGNORE_ERROR"],
  overlayId
});

const closeOverlayImmediately = overlayId => ({
  type: REMOVE_OVERLAY,
  overlayId
});

const closeOverlay = name => (dispatch, getState) => {
  const closingAnimationDuration = 400; // ms
  const overlays = doto(
    getState(),
    f.getOr([], "overlays.overlays"),
    f.reject(f.propEq("exiting", true))
  );
  const overlayToClose = f.isString(name)
    ? f.find(f.propEq("name", name), overlays)
    : f.last(overlays);
  if (f.isEmpty(overlayToClose)) {
    return null;
  }

  const fullSizeOverlays = overlays.filter(f.propEq("type", "full-height"));
  return fullSizeOverlays.length > 1 && overlayToClose.type === "full-height"
    ? dispatch(
        closeOverlayWithAnimation({
          overlayId: overlayToClose.id,
          closingAnimationDuration
        })
      )
    : dispatch(closeOverlayImmediately(overlayToClose.id));
};

const createDisplayValueWorker = () => {
  return {
    type: SET_DISPLAY_VALUE_WORKER
  };
};

const toggleCellSelection = action => {
  // update url without navigation
  window.history.replaceState({}, null, urlToTableDestination(action));
  return dispatchParamsFor(TOGGLE_CELL_SELECTION)(action);
};

const toggleCellEditing = action => {
  return dispatchParamsFor(TOGGLE_CELL_EDITING)(action);
};

const appendFilters = filter => (dispatch, getState) => {
  const state = getState();
  const {
    tableView: { filters, sorting }
  } = state;
  dispatch({
    type: SET_FILTERS_AND_SORTING,
    filters: f.concat(filters, filter),
    sorting
  });
};

const setFiltersAndSorting = (filters, sorting, shouldSave) => (
  dispatch,
  getState
) => {
  dispatch({
    type: SET_FILTERS_AND_SORTING,
    filters,
    sorting
  });
  const rowsFilter = {
    sortColumnName: f.get("colName", sorting),
    sortDirection: f.get("direction", sorting),
    filters
  };
  if (shouldSave) {
    const currentTable = f.get(["tableView", "currentTable"], getState());
    dispatch(
      upsertUserSetting(
        { key: "rowsFilter", kind: "table", tableId: currentTable },
        { value: rowsFilter }
      )
    );
  }
};

const setShowArchivedRows = (
  _table,
  shouldShow = ShowArchived.hide
) => dispatch => {
  dispatch({ type: SET_FILTERS_AND_SORTING, showArchived: shouldShow });
};

const setAnnotationHighlight = (annotationHighlight = "") => (
  dispatch,
  getState
) => {
  dispatch({ type: SET_ANNOTATION_HIGHLIGHT, annotationHighlight });
  const tableId = f.get(["tableView", "currentTable"], getState());
  dispatch(
    upsertUserSetting(
      { key: "annotationHighlight", kind: "table", tableId },
      { value: annotationHighlight }
    )
  );
};

const deleteRow = action => {
  const { mergeWithRowId, tableId, rowId } = action;
  const queryString =
    typeof mergeWithRowId === "number"
      ? `?replacingRowId=${mergeWithRowId}`
      : "";

  return {
    ...action,
    promise: makeRequest({
      apiRoute: toRow({ tableId, rowId }) + queryString,
      method: "DELETE"
    }),
    actionTypes: [DELETE_ROW, "NOTHING_TO_DO", "NOTHING_TO_DO"]
  };
};

const editColumn = (columnId, tableId, data) => {
  return {
    promise: makeRequest({
      apiRoute: toColumn({ tableId, columnId }),
      method: "POST",
      data
    }),
    actionTypes: [COLUMN_EDIT, COLUMN_EDIT_SUCCESS, COLUMN_EDIT_ERROR],
    tableId,
    columnId
  };
};

const createAndLoadRow = async (dispatch, tableId, { columns, rows } = {}) => {
  const response = await makeRequest({
    apiRoute: API_ROUTES.toRows(tableId),
    method: "POST",
    ...(columns && rows && { data: { columns, rows } })
  });
  const responseRows = Array.isArray(response)
    ? response
    : Array.isArray(response.rows)
    ? response.rows
    : [response];
  dispatch(addRows(tableId, responseRows));
  return responseRows;
};

export const addEmptyRowAndOpenEntityView = (
  tableId,
  langtag,
  cellToUpdate,
  onSuccess
) => async dispatch => {
  await dispatch(loadColumns(tableId));
  const [freshRow] = await createAndLoadRow(dispatch, tableId);

  dispatch(
    changeCellValue({
      cell: cellToUpdate,
      oldValue: cellToUpdate.value,
      newValue: [...cellToUpdate.value, { id: freshRow.id, label: "" }]
    })
  );
  loadAndOpenEntityView({ tableId, rowId: freshRow.id, langtag, cellToUpdate });
  onSuccess && onSuccess(freshRow);
};

const fetchSingleRow = ({ tableId, selectedRowId }) => async dispatch => {
  const url = urlToTableDestination({ tableId, rowId: selectedRowId });
  const row = await makeRequest({ url });
  dispatch({ type: ADD_ROWS, rows: [row], tableId });
};

const changeTableName = (tableId, displayName) => ({
  promise: makeRequest({
    apiRoute: toTable({ tableId }),
    method: "POST",
    data: displayName
  }),
  actionTypes: [
    TABLE_NAME_EDIT,
    TABLE_NAME_EDIT_SUCCESS,
    TABLE_NAME_EDIT_ERROR
  ],
  tableId
});

const rerenderTable = () => ({
  type: RERENDER_TABLE
});

const actionCreators = {
  loadTables: loadTables,
  loadColumns: loadColumns,
  loadAllRows: loadAllRows,
  createAndLoadRow,
  toggleColumnVisibility: toggleColumnVisibility,
  setColumnsVisible: setColumnsVisible,
  hideAllColumns: hideAllColumns,
  setCurrentTable: setCurrentTable,
  generateDisplayValues: generateDisplayValues,
  addDisplayValues: dispatchParamsFor(GENERATED_DISPLAY_VALUES),
  loadCompleteTable,
  applyUserSettings,
  loadTableView,
  setCurrentLanguage: setCurrentLanguage,
  addSkeletonColumns: dispatchParamsFor(COLUMNS_DATA_LOADED),
  addSkeletonRow: dispatchParamsFor(ADDITIONAL_ROWS_DATA_LOADED),
  toggleCellSelection,
  toggleCellEditing,
  setPreventCellDeselection: dispatchParamsFor(SET_PREVENT_CELL_DESELECTION),
  toggleExpandedRow: dispatchParamsFor(TOGGLE_EXPANDED_ROW),
  copyCellValue: dispatchParamsFor(COPY_CELL_VALUE_TO_CLIPBOARD),
  changeCellValue,
  deleteRow,
  duplicateRow: Row.safelyDuplicateRow,
  addAnnotationLangtags,
  removeAnnotationLangtags,
  addTextAnnotation,
  removeTextAnnotation,
  toggleAnnotationFlag,
  showToast,
  hideToast,
  openOverlay,
  closeOverlay,
  setStatusInfo: dispatchParamsFor(SET_STATUS_INFO),
  setOverlayState: dispatchParamsFor(SET_OVERLAY_STATE),
  createDisplayValueWorker: createDisplayValueWorker,
  getMediaFolder: MediaActions.getMediaFolder,
  createMediaFolder: MediaActions.createMediaFolder,
  editMediaFolder: MediaActions.editMediaFolder,
  deleteMediaFolder: MediaActions.deleteMediaFolder,
  getMediaFile: MediaActions.getMediaFile,
  editMediaFile: MediaActions.editMediaFile,
  deleteMediaFile: MediaActions.deleteMediaFile,
  setFiltersAndSorting: setFiltersAndSorting,
  appendFilters: appendFilters,
  cleanUp: cleanUp,
  modifyHistory,
  addEmptyRow: Row.addEmptyRow,
  setAllRowsFinal,
  editColumn,
  addEmptyRowAndOpenEntityView,
  changeTableName,
  queryFrontendServices,
  setUserAuthenticated: dispatchParamsFor(SET_USER_AUTHENTICATED),
  setColumnOrdering,
  setColumnWidths,
  rerenderTable,
  toggleMultiselectArea: dispatchParamsSafelyFor(
    ["cell", "columns", "rows"],
    MultiSelect.TOGGLE_MULTISELECT_AREA
  ),
  toggleMultiselectCell: dispatchParamsSafelyFor(
    ["cell"],
    MultiSelect.TOGGLE_MULTISELECT_CELL
  ),
  clearMultiselect: dispatchParamsFor(MultiSelect.CLEAR_MULTISELECT),
  setShowArchivedRows,
  fetchSingleRow,
  setAnnotationHighlight,
  getUserSettings,
  upsertUserSetting,
  deleteUserSettings
};

export default actionCreators;
