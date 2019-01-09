import f from "lodash/fp";
import actionTypes from "../actionTypes";
import {toObjectById} from "../../helpers/funcHelpers";
import getDisplayValue from "../../helpers/getDisplayValue";

const {
  TOGGLE_COLUMN_VISIBILITY,
  HIDE_ALL_COLUMNS,
  SET_COLUMNS_VISIBLE,
  SET_FILTERS_AND_SORTING,
  SET_CURRENT_TABLE,
  COLUMNS_DATA_LOADED,
  DELETE_FILTERS,
  GENERATED_DISPLAY_VALUES,
  START_GENERATING_DISPLAY_VALUES,
  SET_CURRENT_LANGUAGE,
  SET_DISPLAY_VALUE_WORKER
} = actionTypes;

const initialState = {
  visibleColumns: [],
  filters: [],
  sorting: {},
  currentTable: null,
  displayValues: {},
  startedGeneratingDisplayValues: false,
  currentLanguage: "de",
  worker: null
};

const tableView = (state = initialState, action) => {
  switch (action.type) {
    case TOGGLE_COLUMN_VISIBILITY:
      return toggleSingleColumn(state, action);
    case HIDE_ALL_COLUMNS:
      return {...state, visibleColumns: []};
    case SET_COLUMNS_VISIBLE:
      return {...state, visibleColumns: action.columnIds};
    case SET_FILTERS_AND_SORTING:
      return {...state, filters: action.filters, sorting: action.sorting};
    case DELETE_FILTERS:
      return {...state, filters: []};
    case SET_CURRENT_TABLE:
      return {...state, currentTable: action.tableId};
    case COLUMNS_DATA_LOADED:
      return setInitialVisibleColumns(state, action);
    case GENERATED_DISPLAY_VALUES:
      return {...state, displayValues: action.displayValues};
    case START_GENERATING_DISPLAY_VALUES:
      return {...state, startedGeneratingDisplayValues: true};
    case SET_CURRENT_LANGUAGE:
      return {...state, currentLanguage: action.lang};
    case SET_DISPLAY_VALUE_WORKER:
      return {
        ...state,
        worker: new Worker("/worker.bundle.js")
      };
    default:
      return state;
  }
};

const setInitialVisibleColumns = (state, action) =>
  f.compose(
    ids => f.assoc("visibleColumns")(ids)(state),
    f.map("id"),
    f.slice(0, 10),
    f.prop(["result", "columns"])
  )(action);

const toggleSingleColumn = (state, action) => {
  const {columnId} = action;
  const {visibleColumns} = state;
  const updatedVisibleColumns = f.includes(columnId, visibleColumns)
    ? f.without([columnId], visibleColumns)
    : f.concat(visibleColumns, columnId);
  return {...state, visibleColumns: updatedVisibleColumns};
};

export default tableView;
