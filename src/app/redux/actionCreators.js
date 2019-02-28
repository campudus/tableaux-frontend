import f from "lodash/fp";

import { Langtags } from "../constants/TableauxConstants";
import {
  addAnnotationLangtags,
  addTextAnnotation,
  removeAnnotationLangtags,
  removeTextAnnotation,
  toggleAnnotationFlag
} from "./actions/annotationActions";
import { changeCellValue,modifyHistory } from "./actions/cellActions";
import { checkOrThrow } from "../specs/type";
import { doto } from "../helpers/functools";
import {
  getStoredViewObject,
  saveFilterSettings,
  saveColumnVisibility
} from "../helpers/localStorage";
import { isLocked } from "../helpers/annotationHelper";
import {
  addEmptyRow,
  safelyDuplicateRow
} from "./actions/rowActions";
import { makeRequest } from "../helpers/apiHelper";
import { overlayParamsSpec } from "./reducers/overlays";
import API_ROUTES from "../helpers/apiRoutes";
import actionTypes from "./actionTypes";
import askForSessionUnlock from "../components/helperComponents/SessionUnlockDialog";

const {
  getAllTables,
  getAllColumnsForTable,
  toRow,
  toFolder,
  toFile,
  toColumn
} = API_ROUTES;

const {
  TABLE_LOADING_DATA,
  TABLE_DATA_LOADED,
  TABLE_DATA_LOAD_ERROR,
  TOGGLE_COLUMN_VISIBILITY,
  COLUMNS_LOADING_DATA,
  COLUMNS_DATA_LOADED,
  COLUMNS_DATA_LOAD_ERROR,
  ALL_ROWS_DATA_LOADED,
  ADDITIONAL_ROWS_DATA_LOADED,
  DELETE_ROW,
  DUPLICATE_ROW,
  SET_COLUMNS_VISIBLE,
  HIDE_ALL_COLUMNS,
  SET_CURRENT_TABLE,
  GENERATED_DISPLAY_VALUES,
  START_GENERATING_DISPLAY_VALUES,
  SET_CURRENT_LANGUAGE,
  SET_DISPLAY_VALUE_WORKER,
  SET_FILTERS_AND_SORTING,
  SET_SEARCH_OVERLAY,
  CLEAN_UP,
  ADD_ROWS,
  COLUMN_EDIT,
  COLUMN_EDIT_SUCCESS,
  COLUMN_EDIT_ERROR,
  ROW_CREATE,
  ROW_CREATE_SUCCESS,
  ROW_CREATE_ERROR
} = actionTypes;

const {
  TOGGLE_CELL_SELECTION,
  TOGGLE_CELL_EDITING,
  TOGGLE_EXPANDED_ROW
} = actionTypes.tableView;

const {
  SHOW_TOAST,
  HIDE_TOAST,
  OPEN_OVERLAY,
  SET_OVERLAY_STATE,
  CLOSE_OVERLAY,
  REMOVE_OVERLAY
} = actionTypes.overlays;

const {
  MEDIA_FOLDER_GET,
  MEDIA_FOLDER_GET_SUCCESS,
  MEDIA_FOLDER_GET_ERROR,
  MEDIA_FOLDER_CREATE,
  MEDIA_FOLDER_CREATE_SUCCESS,
  MEDIA_FOLDER_CREATE_ERROR,
  MEDIA_FOLDER_EDIT,
  MEDIA_FOLDER_EDIT_SUCCESS,
  MEDIA_FOLDER_EDIT_ERROR,
  MEDIA_FOLDER_DELETE,
  MEDIA_FOLDER_DELETE_SUCCESS,
  MEDIA_FOLDER_DELETE_ERROR,

  MEDIA_FILE_GET,
  MEDIA_FILE_GET_SUCCESS,
  MEDIA_FILE_GET_ERROR,
  MEDIA_FILE_EDIT,
  MEDIA_FILE_EDIT_SUCCESS,
  MEDIA_FILE_EDIT_ERROR,
  MEDIA_FILE_DELETE,
  MEDIA_FILE_DELETE_SUCCESS,
  MEDIA_FILE_DELETE_ERROR
} = actionTypes.media;

const dispatchParamsFor = actionType => params => ({
  ...params,
  type: actionType
});

const loadTables = () => {
  return {
    promise: makeRequest({ apiRoute: getAllTables(), method: "GET" }),
    actionTypes: [TABLE_LOADING_DATA, TABLE_DATA_LOADED, TABLE_DATA_LOAD_ERROR]
  };
};

const loadColumns = tableId => {
  return {
    promise: makeRequest({
      apiRoute: getAllColumnsForTable(tableId),
      method: "GET"
    }),
    actionTypes: [
      COLUMNS_LOADING_DATA,
      COLUMNS_DATA_LOADED,
      COLUMNS_DATA_LOAD_ERROR
    ],
    tableId
  };
};

const addRows = (tableId, rows) => {
  return {
    type: "ADD_ROWS",
    tableId,
    rows
  };
};

const loadAllRows = tableId => (dispatch, getState) => {
  const buildParams = (allRows, rowsPerRequest) => {
    if (allRows <= rowsPerRequest) {
      return [{ offset: 30, limit: allRows }];
    }
    return f.compose(
      f.map(offset => {
        return { offset, limit: rowsPerRequest };
      }),
      f.rangeStep(rowsPerRequest, 30)
    )(allRows % rowsPerRequest !== 0 ? allRows + 1 : allRows);
  };

  const fetchRowsPaginated = async (tableId, parallelRequests) => {
    const { toRows } = API_ROUTES;
    const {
      page: { totalSize },
      rows
    } = await makeRequest({
      apiRoute: toRows(tableId),
      params: {
        offset: 0,
        limit: 30
      },
      method: "GET"
    });
    dispatch(addRows(tableId, rows));
    const params = buildParams(totalSize, 500);
    var resultLength = rows.length;
    var index = 0;
    const recReq = () => {
      if (index >= params.length) {
        return;
      }
      const oldIndex = index;
      index++;
      return makeRequest({
        apiRoute: toRows(tableId),
        params: params[oldIndex],
        method: "GET"
      }).then(result => {
        resultLength = resultLength + result.rows.length;
        dispatch(addRows(tableId, result.rows));
        if (resultLength >= totalSize) {
          dispatch({ type: ALL_ROWS_DATA_LOADED, tableId });
          return;
        }
        recReq();
      });
    };
    f.forEach(
      recReq,
      new Array(
        parallelRequests > params.length ? params.length : parallelRequests
      )
    );
  };
  fetchRowsPaginated(tableId, 4);
};

const toggleColumnVisibility = (columnId) => {
  return {
    type: TOGGLE_COLUMN_VISIBILITY,
    columnId
  };
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
  saveColumnVisibility(tableId, columnIds);
};
const hideAllColumns = tableId => {
  return {
    type: HIDE_ALL_COLUMNS,
    tableId
  };
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

const setSearchOverlay = value => {
  return {
    type: SET_SEARCH_OVERLAY,
    value
  };
};

const loadCompleteTable = (tableId, urlFilters) => dispatch => {
  dispatch(setCurrentTable(tableId));
  dispatch(loadColumns(tableId));
  dispatch(loadAllRows(tableId));

  const { visibleColumns, rowsFilter } = getStoredViewObject(tableId);
  if (urlFilters) {
    dispatch(setFiltersAndSorting(urlFilters, null));
  } else {
    if (!f.isEmpty(f.get("filters", rowsFilter))) {
      const { filters, sortColumnId, sortValue } = rowsFilter;
      dispatch(setFiltersAndSorting(filters, { sortColumnId, sortValue }));
    }
  }
  dispatch(setColumnsVisible(visibleColumns));
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
        duration: data.duratin || 2700
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
  console.log("Close overlay:", name, overlayToClose);

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

const toggleCellEditingOrUnlockCell = action => {
  // when triggered from keyboard, event.key should be passed to
  // prevent editing while still locked
  const { row, eventKey } = action;
  return isLocked(row)
    ? showToast(askForSessionUnlock(row, eventKey))
    : dispatchParamsFor(TOGGLE_CELL_EDITING)(action);
};

const getMediaFolder = (folderId, langtag) => {
  return {
    promise: makeRequest({
      apiRoute: toFolder(folderId, langtag),
      method: "GET"
    }),
    actionTypes: [
      MEDIA_FOLDER_GET,
      MEDIA_FOLDER_GET_SUCCESS,
      MEDIA_FOLDER_GET_ERROR
    ]
  };
};

const createMediaFolder = data => {
  return {
    promise: makeRequest({
      apiRoute: toFolder(),
      data: data,
      method: "POST"
    }),
    actionTypes: [
      MEDIA_FOLDER_CREATE,
      MEDIA_FOLDER_CREATE_SUCCESS,
      MEDIA_FOLDER_CREATE_ERROR
    ]
  };
};

const editMediaFolder = (folderId, data) => {
  return {
    promise: makeRequest({
      apiRoute: toFolder(folderId),
      data: data,
      method: "PUT"
    }),
    actionTypes: [
      MEDIA_FOLDER_EDIT,
      MEDIA_FOLDER_EDIT_SUCCESS,
      MEDIA_FOLDER_EDIT_ERROR
    ]
  };
};

const deleteMediaFolder = folderId => {
  return {
    promise: makeRequest({
      apiRoute: toFolder(folderId),
      method: "DELETE"
    }),
    actionTypes: [
      MEDIA_FOLDER_DELETE,
      MEDIA_FOLDER_DELETE_SUCCESS,
      MEDIA_FOLDER_DELETE_ERROR
    ]
  };
};

const getMediaFile = fileId => {
  return {
    promise: makeRequest({
      apiRoute: toFile(fileId),
      method: "GET"
    }),
    actionTypes: [MEDIA_FILE_GET, MEDIA_FILE_GET_SUCCESS, MEDIA_FILE_GET_ERROR]
  };
};

const editMediaFile = (fileId, data) => {
  return {
    promise: makeRequest({
      apiRoute: toFile(fileId),
      data: data,
      method: "PUT"
    }),
    actionTypes: [
      MEDIA_FILE_EDIT,
      MEDIA_FILE_EDIT_SUCCESS,
      MEDIA_FILE_EDIT_ERROR
    ]
  };
};

const deleteMediaFile = fileId => {
  return {
    promise: makeRequest({
      apiRoute: toFile(fileId),
      method: "DELETE"
    }),
    actionTypes: [
      MEDIA_FILE_DELETE,
      MEDIA_FILE_DELETE_SUCCESS,
      MEDIA_FILE_DELETE_ERROR
    ]
  };
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
  const isFilterEmpty = filter =>
    f.isEmpty(filter.value) && !f.isString(filter.mode);
  const rowsFilter = {
    sortColumnId: f.get("columnId", sorting),
    sortValue: f.get("value", sorting),
    filters: f.reject(isFilterEmpty, filters)
  };
  if (shouldSave) {
    const currentTable = f.get(["tableView", "currentTable"], getState());
    saveFilterSettings(currentTable, rowsFilter);
  }
};

const deleteRow = action => ({
  ...action,
  promise: makeRequest({
    apiRoute: toRow({ tableId: action.table.id, rowId: action.row.id }),
    method: "DELETE"
  }),
  actionTypes: [DELETE_ROW, "NOTHING_TO_DO", "NOTHING_TO_DO"]
});

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

const actionCreators = {
  loadTables: loadTables,
  loadColumns: loadColumns,
  loadAllRows: loadAllRows,
  toggleColumnVisibility: toggleColumnVisibility,
  setColumnsVisible: setColumnsVisible,
  hideAllColumns: hideAllColumns,
  setCurrentTable: setCurrentTable,
  generateDisplayValues: generateDisplayValues,
  addDisplayValues: dispatchParamsFor(GENERATED_DISPLAY_VALUES),
  loadCompleteTable: loadCompleteTable,
  setCurrentLanguage: setCurrentLanguage,
  addSkeletonColumns: dispatchParamsFor(COLUMNS_DATA_LOADED),
  addSkeletonRow: dispatchParamsFor(ADDITIONAL_ROWS_DATA_LOADED),
  toggleCellSelection: dispatchParamsFor(TOGGLE_CELL_SELECTION),
  toggleCellEditing: toggleCellEditingOrUnlockCell,
  toggleExpandedRow: dispatchParamsFor(TOGGLE_EXPANDED_ROW),
  changeCellValue,
  deleteRow,
  duplicateRow: safelyDuplicateRow,
  addAnnotationLangtags,
  removeAnnotationLangtags,
  addTextAnnotation,
  removeTextAnnotation,
  toggleAnnotationFlag,
  showToast,
  hideToast,
  openOverlay,
  closeOverlay,
  setOverlayState: dispatchParamsFor(SET_OVERLAY_STATE),
  createDisplayValueWorker: createDisplayValueWorker,
  getMediaFolder: getMediaFolder,
  createMediaFolder: createMediaFolder,
  editMediaFolder: editMediaFolder,
  deleteMediaFolder: deleteMediaFolder,
  getMediaFile: getMediaFile,
  editMediaFile: editMediaFile,
  deleteMediaFile: deleteMediaFile,
  setFiltersAndSorting: setFiltersAndSorting,
  cleanUp: cleanUp,
  addEmptyRow: addEmptyRow,
  editColumn
};

export default actionCreators;
