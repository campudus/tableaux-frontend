import actionTypes from "./actionTypes";
import { makeRequest } from "../helpers/apiHelper";
import API_ROUTES from "../helpers/apiRoutes";
import { changeCellValue } from "./actions/cellActions";

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
  SHOW_ALL_COLUMNS,
  HIDE_ALL_COLUMNS
} = actionTypes;

const { TOGGLE_CELL_SELECTION, TOGGLE_CELL_EDITING } = actionTypes.tableView;

const dispatchParamsFor = actionType => params => ({
  ...params,
  type: actionType
});

const loadTables = () => {
  console.log("loadTables");
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
    tableId,
    columnId
  };
};

const showAllColumns = tableId => {
  return {
    type: SHOW_ALL_COLUMNS,
    tableId
  };
};
const hideAllColumns = tableId => {
  return {
    type: HIDE_ALL_COLUMNS,
    tableId
  };
};

const actionCreators = {
  loadTables: loadTables,
  loadColumns: loadColumns,
  loadAllRows: loadAllRows,
  toggleColumnVisibility: toggleColumnVisibility,
  showAllColumns: showAllColumns,
  hideAllColumns: hideAllColumns,
  toggleCellSelection: dispatchParamsFor(TOGGLE_CELL_SELECTION),
  toggleCellEditing: dispatchParamsFor(TOGGLE_CELL_EDITING),
  changeCellValue
};

export default actionCreators;
