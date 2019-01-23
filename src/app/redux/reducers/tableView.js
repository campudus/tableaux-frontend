import actionTypes from "../actionTypes";
import f from "lodash/fp";
import { DefaultLangtag, langtags } from "../../constants/TableauxConstants";
import { setUrlBarToCell } from "../../helpers/browserNavigation";
import { checkOrThrow } from "../../specs/type";
import { toObjectById } from "../../helpers/funcHelpers";
import getDisplayValue from "../../helpers/getDisplayValue";
import { extractAnnotations } from "../../helpers/annotationHelper";
import getFilteredRows from "../../components/table/RowFilters";
import { combineDisplayValuesWithLinks } from "../../helpers/linkHelper";

const { TOGGLE_CELL_SELECTION, TOGGLE_CELL_EDITING } = actionTypes.tableView;
const {
  TOGGLE_COLUMN_VISIBILITY,
  HIDE_ALL_COLUMNS,
  SET_COLUMNS_VISIBLE,
  SET_CURRENT_TABLE,
  COLUMNS_DATA_LOADED,
  DELETE_FILTERS,
  GENERATED_DISPLAY_VALUES,
  START_GENERATING_DISPLAY_VALUES,
  SET_CURRENT_LANGUAGE,
  SET_DISPLAY_VALUE_WORKER,
  ALL_ROWS_DATA_LOADED,
  APPLY_FILTERS_AND_SORTING
} = actionTypes;

const initialState = {
  selectedCell: {},
  editing: false,
  visibleColumns: [],
  currentTable: null,
  displayValues: {},
  startedGeneratingDisplayValues: false,
  currentLanguage: DefaultLangtag,
  invisibleRows: []
};
const setLinkDisplayValues = (state, linkDisplayValues) => {
  const { displayValues } = state;
  const updatedDisplayValues = f.reduce(
    (acc, val) => {
      const { values } = val;
      return f.assoc(
        [f.get("tableId", val)],
        f.map(element => {
          return { id: element.id, values: element.values };
        }, values),
        acc
      );
    },
    displayValues,
    linkDisplayValues
  );
  return { ...state, displayValues: updatedDisplayValues };
};

const toggleSelectedCell = (state, action) => {
  checkOrThrow(toggleCellSelectionActionSpec, action);
  if (action.pushHistory !== false && action.select !== false) {
    setUrlBarToCell({
      tableId: action.tableId,
      rowId: action.rowId,
      columnId: action.columnId,
      langtag:
        action.langtag ||
        (state.tableView && state.tableView.langtag) ||
        DefaultLangtag
    });
  }
  // TODO: unlock row
  return f.flow(
    f.assoc("editing", false),
    f.update("selectedCell", prevSelection =>
      action.select !== false &&
      (prevSelection.rowId !== action.rowId ||
        prevSelection.columnId !== action.columnId)
        ? f.pick(["rowId", "columnId"], action)
        : {}
    )
  )(state);
};

const isLangtagOrNil = lt => f.isNil(lt) || f.contains(lt, langtags);

const toggleCellSelectionActionSpec = {
  tableId: f.isNumber,
  columnId: f.isNumber,
  rowId: f.isNumber,
  langtag: isLangtagOrNil
};

const toggleCellEditing = (state, action) => {
  // console.log("toggleCellEditing", action);
  // TODO: Check if editable
  return f.update(
    "editing",
    wasEditing => action.editing !== false && !wasEditing,
    state
  );
};

const setInitialVisibleColumns = (state, action) =>
  f.compose(
    ids => f.assoc("visibleColumns")(ids)(state),
    f.map("id"),
    f.slice(0, 10),
    f.prop(["result", "columns"])
  )(action);

const toggleSingleColumn = (state, action) => {
  const { columnId } = action;
  const { visibleColumns } = state;
  const updatedVisibleColumns = f.includes(columnId, visibleColumns)
    ? f.without([columnId], visibleColumns)
    : f.concat(visibleColumns, columnId);
  return { ...state, visibleColumns: updatedVisibleColumns };
};

export default (state = initialState, action, completeState) => {
  switch (action.type) {
    case TOGGLE_COLUMN_VISIBILITY:
      return toggleSingleColumn(state, action);
    case HIDE_ALL_COLUMNS:
      return { ...state, visibleColumns: [f.head(state.visibleColumns)] };
    case SET_COLUMNS_VISIBLE:
      return { ...state, visibleColumns: action.columnIds };
    case APPLY_FILTERS_AND_SORTING:
      const { colsWithMatches, visibleRows } = updateVisibleColumns(
        state,
        completeState,
        action
      );
      return {
        ...state,
        visibleColumns: colsWithMatches,
        visibleRows: visibleRows
      };

    case SET_CURRENT_TABLE:
      return { ...state, currentTable: action.tableId };
    case COLUMNS_DATA_LOADED:
      return setInitialVisibleColumns(state, action);
    case GENERATED_DISPLAY_VALUES:
      return setLinkDisplayValues(state, action.displayValues);
    case START_GENERATING_DISPLAY_VALUES:
      return { ...state, startedGeneratingDisplayValues: true };
    case SET_CURRENT_LANGUAGE:
      return { ...state, currentLanguage: action.lang };
    case TOGGLE_CELL_SELECTION:
      return toggleSelectedCell(state, action);
    case TOGGLE_CELL_EDITING:
      return toggleCellEditing(state, action);
    case SET_DISPLAY_VALUE_WORKER:
      return {
        ...state,
        worker: new Worker("/worker.bundle.js")
      };
    case ALL_ROWS_DATA_LOADED:
      return {
        ...state,
        visibleRows: f.compose(
          f.map(f.toInteger),
          f.keys
        )(action.result.rows)
      };

    default:
      return state;
  }
};

const updateVisibleColumns = (state, completeState, action) => {
  const { currentTable } = state;
  const [columns, table] = f.props(
    [["columns", currentTable, "data"], ["tables", "data", currentTable]],
    completeState
  );
  const { filters, sorting, preparedRows, langtag } = action;

  const isFilterEmpty = filter =>
    f.isEmpty(filter.value) && !f.isString(filter.mode);
  const rowsFilter = {
    sortColumnId: sorting.columnId,
    sortValue: sorting.value,
    filters: f.reject(isFilterEmpty, filters)
  };
  const { colsWithMatches, visibleRows } = getFilteredRows(
    table,
    preparedRows,
    columns,
    langtag,
    rowsFilter
  );
  if (f.isEmpty(colsWithMatches)) {
    return { visibleRows, colsWithMatches: state.visibleColumns };
  }
  return { colsWithMatches, visibleRows };
};
