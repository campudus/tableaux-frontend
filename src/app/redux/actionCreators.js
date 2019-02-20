import f from "lodash/fp";

import { Langtags } from "../constants/TableauxConstants";
import {
  addAnnotationLangtags,
  addTextAnnotation,
  removeAnnotationLangtags,
  removeTextAnnotation,
  toggleAnnotationFlag
} from "./actions/annotationActions";
import { changeCellValue } from "./actions/cellActions";
import { checkOrThrow } from "../specs/type";
import { doto } from "../helpers/functools";
import { isLocked } from "../helpers/annotationHelper";
import { makeRequest } from "../helpers/apiHelper";
import { overlayParamsSpec } from "./reducers/overlays";
import API_ROUTES from "../helpers/apiRoutes";
import actionTypes from "./actionTypes";
import askForSessionUnlock from "../components/helperComponents/SessionUnlockDialog";
import { either } from "../helpers/functools";
import getFilteredRows from "../components/table/RowFilters";

const {
  getAllTables,
  getAllColumnsForTable,
  getAllRowsForTable,
  toFolder,
  toFile
} = API_ROUTES;

const {
  APPLY_FILTERS_AND_SORTING,
  TABLE_LOADING_DATA,
  TABLE_DATA_LOADED,
  TABLE_DATA_LOAD_ERROR,
  TOGGLE_COLUMN_VISIBILITY,
  COLUMNS_LOADING_DATA,
  COLUMNS_DATA_LOADED,
  COLUMNS_DATA_LOAD_ERROR,
  ALL_ROWS_LOADING_DATA,
  ALL_ROWS_DATA_LOADED,
  ALL_ROWS_DATA_LOAD_ERROR,
  ADDITIONAL_ROWS_DATA_LOADED,
  SET_COLUMNS_VISIBLE,
  HIDE_ALL_COLUMNS,
  SET_CURRENT_TABLE,
  GENERATED_DISPLAY_VALUES,
  START_GENERATING_DISPLAY_VALUES,
  SET_CURRENT_LANGUAGE,
  SET_DISPLAY_VALUE_WORKER,
  SET_FILTERS_AND_SORTING
} = actionTypes;

const { TOGGLE_CELL_SELECTION, TOGGLE_CELL_EDITING } = actionTypes.tableView;
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

const loadAllRows = tableId => {
  return {
    promise: makeRequest({
      apiRoute: getAllRowsForTable(tableId),
      method: "GET"
    }),
    actionTypes: [
      ALL_ROWS_LOADING_DATA,
      ALL_ROWS_DATA_LOADED,
      ALL_ROWS_DATA_LOAD_ERROR
    ],
    tableId
  };
};

const toggleColumnVisibility = (tableId, columnId) => {
  return {
    type: TOGGLE_COLUMN_VISIBILITY,
    columnId
  };
};

const setColumnsVisible = columnIds => {
  return {
    type: SET_COLUMNS_VISIBLE,
    columnIds
  };
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

const generateDisplayValues = (rows, columns, tableId,langtag) => (
  dispatch,
  getState
) => {
  dispatch({ type: START_GENERATING_DISPLAY_VALUES });
  const {
    tableView: { worker, filters }
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
    if (!f.isEmpty(filters)) {
      dispatch(applyFiltersAndSorting(null, null,langtag));
    }
  };
};

const loadCompleteTable = (tableId, urlFilters) => dispatch => {
  dispatch(setCurrentTable(tableId));
  dispatch(loadColumns(tableId));
  dispatch(loadAllRows(tableId));

  const getStoredViewObject = (tableId = null, name = "default") => {
    if (tableId) {
      return either(localStorage)
        .map(f.get("tableViews"))
        .map(JSON.parse)
        .map(f.get([tableId.toString(), name]))
        .getOrElse(null);
    } else {
      return either(localStorage)
        .map(f.get("tableViews"))
        .map(JSON.parse)
        .getOrElse({});
    }
  };

  const storedViewObject = getStoredViewObject(tableId);
  const columnView = f.get("visibleColumns", storedViewObject);
  const rowsFilter = urlFilters || f.get("rowsFilter", storedViewObject) || [];
  if (!f.isEmpty(rowsFilter)) {
    dispatch(applyFiltersAndSorting(rowsFilter, []));
  }
  dispatch(setColumnsVisible(columnView));
};

const setCurrentLanguage = lang => {
  return {
    type: SET_CURRENT_LANGUAGE,
    lang
  };
};
const applyFiltersAndSorting = (filters, sorting, langtag) => (
  dispatch,
  getState
) => {
  if (filters && sorting) {
    dispatch(setFiltersAndSorting(filters, sorting));
  }
  if (!f.isEmpty(f.get(["tableView", "displayValues"], getState()))) {
    const updateVisibleRows = completeState => {
      const state = completeState.tableView;
      const { currentTable } = state;
      const [columns, rows, table] = f.props(
        [
          ["columns", currentTable, "data"],
          ["rows", currentTable, "data"],
          ["tables", "data", currentTable]
        ],
        completeState
      );
      const { filters, sorting } = state;

      const isFilterEmpty = filter =>
        f.isEmpty(filter.value) && !f.isString(filter.mode);
      const rowsFilter = {
        sortColumnId: sorting.columnId,
        sortValue: sorting.value,
        filters: f.reject(isFilterEmpty, filters)
      };
      const unfilteredRows = rows.map(f.identity);
      const { colsWithMatches, visibleRows } = getFilteredRows(
        table,
        unfilteredRows,
        columns,
        langtag,
        rowsFilter
      );
      return {
        visibleColumns: colsWithMatches || state.visibleColumns,
        visibleRows
      };
    };
    const { visibleColumns, visibleRows } = updateVisibleRows(getState());
    const action = () => {
      return { type: APPLY_FILTERS_AND_SORTING, visibleColumns, visibleRows };
    };
    dispatch(action());
  }

  // const state = getState();
  // const currentTable = f.get(["tableView", "currentTable"], state);
  // const displayValues = f.get(
  //   ["tableView", "displayValues", currentTable],
  //   state
  // );
  // const validFilters = filters || f.get(["tableView", "filters"], state);
  // const validSorting = sorting || f.get(["tableView", "sorting"], state);
  // if (f.isEmpty(displayValues)) {
  //   return dispatch(setFiltersAndSorting(validFilters, validSorting));
  // }
  // const filterSettings = { filter: validFilters, sorting: validSorting };
  // const rows = f.get(["rows", currentTable,"data"], state);
  // const columns = f.get(["columns", currentTable,"data"], state);
  // const langtag = f.get(["tableView", "currentLangtag"], state);
  // const tableDisplayValues = f.get(["tableView", "displayValues",currentTable], state);

  // const { visibleRows, colsWithMatches } = getFilteredRows(
  //   currentTable,
  //   rows,
  //   columns,
  //   langtag,
  //   filterSettings,
  //   tableDisplayValues
  // );
  // console.log(visibleRows)
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
const setFiltersAndSorting = (filters, sorting) => {
  return {
    type: SET_FILTERS_AND_SORTING,
    filters,
    sorting
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
  changeCellValue,
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
  applyFiltersAndSorting: applyFiltersAndSorting
};

export default actionCreators;
