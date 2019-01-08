import actionTypes from "../actionTypes";
import f from "lodash/fp";
import { DefaultLangtag, langtags } from "../../constants/TableauxConstants";
import { setUrlBarToCell } from "../../helpers/browserNavigation";
import { checkOrThrow } from "../../specs/type";
import { toObjectById } from "../../helpers/funcHelpers";
import getDisplayValue from "../../helpers/getDisplayValue";

const { TOGGLE_CELL_SELECTION, TOGGLE_CELL_EDITING } = actionTypes.tableView;
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
  SET_DISPLAY_VALUE_WORKER,
  CELL_SET_VALUE,
  CELL_ROLLBACK_VALUE
} = ActionTypes;

const initialState = {
  selectedCell: {},
  editing: false,
  visibleColumns: [],
  filters: [],
  sorting: {},
  currentTable: null,
  displayValues: {},
  startedGeneratingDisplayValues: false,
  currentLanguage: DefaultLangtag
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
  console.log("toggleCellEditing", action);
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

const updateDisplayValue = (valueProp, tableView, action, completeState) => {
  const value = f.prop(valueProp, action);
  const { tableId } = action;
  const [rowIdx, columnIdx] = idsToIndices(action, completeState);
  // FIXME: adapt once we address displayValues[tableId][rowIdx][columnIdx]
  const displayValueSelector = ["displayValues", rowIdx, columnIdx];
  const column = completeState.columns[tableId];
  return f.assoc(
    displayValueSelector,
    getDisplayValue(column, value),
    tableView
  );
};

const idsToIndices = ({ tableId, columnId, rowId }, completeState) => {
  try {
    const rowIdx = f.findIndex(
      row => row.id === rowId,
      completeState.rows[tableId].data
    );
    const columnIdx = f.findIndex(
      col => col.id === columnId,
      completeState.columns[tableId].data
    );
    return [rowIdx, columnIdx];
  } catch (err) {
    console.error(
      "tableView Reducer: could not calculate indices for table",
      tableId,
      "row",
      rowId,
      "column",
      columnId,
      err
    );
    return [-1, -1];
  }
};

export default (state = initialState, action, completeState) => {
  switch (action.type) {
    case TOGGLE_COLUMN_VISIBILITY:
      return toggleSingleColumn(state, action);
    case HIDE_ALL_COLUMNS:
      return { ...state, visibleColumns: [] };
    case SET_COLUMNS_VISIBLE:
      return { ...state, visibleColumns: action.columnIds };
    case SET_FILTERS_AND_SORTING:
      return { ...state, filters: action.filters, sorting: action.sorting };
    case DELETE_FILTERS:
      return { ...state, filters: [] };
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
    case CELL_SET_VALUE:
      return updateDisplayValue("newValue", state, action, completeState);
    case CELL_ROLLBACK_VALUE:
      return updateDisplayValue("oldValue", state, action, completeState);
    case SET_DISPLAY_VALUE_WORKER:
      return {
        ...state,
        worker: new Worker("/worker.bundle.js")
      };
    default:
      return state;
  }
};
