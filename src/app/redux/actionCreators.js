import f from "lodash/fp";
import actionTypes from "./actionTypes";
import { makeRequest } from "../helpers/apiHelper";
import API_ROUTES from "../helpers/apiRoutes";
import { changeCellValue } from "./actions/cellActions";
import { Langtags } from "../constants/TableauxConstants";
import { doto } from "../helpers/functools";
import { checkOrThrow } from "../specs/type";
import { overlayParamsSpec } from "./reducers/overlays";
import { isLocked } from "../helpers/annotationHelper";
import askForSessionUnlock from "../components/helperComponents/SessionUnlockDialog";

const { getAllTables, getAllColumnsForTable, getAllRowsForTable } = API_ROUTES;

const {
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
  SET_COLUMNS_VISIBLE,
  HIDE_ALL_COLUMNS,
  SET_FILTERS_AND_SORTING,
  SET_CURRENT_TABLE,
  DELETE_FILTERS,
  GENERATED_DISPLAY_VALUES,
  START_GENERATING_DISPLAY_VALUES,
  SET_CURRENT_LANGUAGE,
  SET_DISPLAY_VALUE_WORKER
} = actionTypes;

const { TOGGLE_CELL_SELECTION, TOGGLE_CELL_EDITING } = actionTypes.tableView;
const {
  SHOW_TOAST,
  HIDE_TOAST,
  OPEN_OVERLAY,
  CLOSE_OVERLAY,
  REMOVE_OVERLAY
} = actionTypes.overlays;

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

const setFiltersAndSorting = (filters, sorting) => {
  return {
    type: SET_FILTERS_AND_SORTING,
    filters,
    sorting
  };
};

const setCurrentTable = tableId => {
  return {
    type: SET_CURRENT_TABLE,
    tableId
  };
};

const deleteFilters = () => {
  return { type: DELETE_FILTERS };
};

const trace = str => element => {
  console.log(str, element);
  return element;
};
const mapWithIndex = f.map.convert({ cap: false });

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
    if (returnedTableId != tableId) {
      return;
    }
    const displayValues = e.data[0];
    dispatch({
      type: GENERATED_DISPLAY_VALUES,
      displayValues
    });
  };
};

const loadCompleteTable = tableId => dispatch => {
  dispatch(setCurrentTable(tableId));
  dispatch(loadColumns(tableId));
  dispatch(loadAllRows(tableId));
};

const setCurrentLanguage = lang => {
  return {
    type: SET_CURRENT_LANGUAGE,
    lang
  };
};

const showToast = ({ content, duration = 2700 }) => {
  console.log("ShowToast", content, duration);
  return {
    type: SHOW_TOAST,
    content,
    duration
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
    ? f.find(f.propEqn("name", name), overlays)
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

const actionCreators = {
  loadTables: loadTables,
  loadColumns: loadColumns,
  loadAllRows: loadAllRows,
  toggleColumnVisibility: toggleColumnVisibility,
  setColumnsVisible: setColumnsVisible,
  hideAllColumns: hideAllColumns,
  setFiltersAndSorting: setFiltersAndSorting,
  setCurrentTable: setCurrentTable,
  deleteFilters: deleteFilters,
  generateDisplayValues: generateDisplayValues,
  loadCompleteTable: loadCompleteTable,
  setCurrentLanguage: setCurrentLanguage,
  toggleCellSelection: dispatchParamsFor(TOGGLE_CELL_SELECTION),
  toggleCellEditing: toggleCellEditingOrUnlockCell,
  changeCellValue,
  showToast,
  hideToast,
  openOverlay,
  closeOverlay,
  createDisplayValueWorker: createDisplayValueWorker
};

export default actionCreators;
