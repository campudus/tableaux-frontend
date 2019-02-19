import ActionTypes from "../actionTypes";
import f from "lodash/fp";
import { DefaultLangtag } from "../../constants/TableauxConstants";
import TableauxRouter from "../../router/router";
import getDisplayValue from "../../helpers/getDisplayValue";
import { idsToIndices, calcConcatValues } from "../redux-helpers";
import { isLocked, unlockRow } from "../../helpers/annotationHelper";
import askForSessionUnlock from "../../components/helperComponents/SessionUnlockDialog";
import getFilteredRows from "../../components/table/RowFilters";

const { TOGGLE_CELL_SELECTION, TOGGLE_CELL_EDITING } = ActionTypes.tableView;
const {
  TOGGLE_COLUMN_VISIBILITY,
  HIDE_ALL_COLUMNS,
  SET_COLUMNS_VISIBLE,
  SET_CURRENT_TABLE,
  COLUMNS_DATA_LOADED,
  GENERATED_DISPLAY_VALUES,
  START_GENERATING_DISPLAY_VALUES,
  SET_CURRENT_LANGUAGE,
  SET_DISPLAY_VALUE_WORKER,
  CELL_SET_VALUE,
  CELL_ROLLBACK_VALUE,
  CELL_SAVED_SUCCESSFULLY,
  ALL_ROWS_DATA_LOADED,
  SET_FILTERS_AND_SORTING
} = ActionTypes;

const initialState = {
  selectedCell: {},
  editing: false,
  visibleColumns: [],
  currentTable: null,
  displayValues: {},
  startedGeneratingDisplayValues: false,
  currentLanguage: DefaultLangtag,
  invisibleRows: [],
  filters: [],
  sorting: []
};

// This sets display values for foreign tables, allowing us to track
// changes made by entity views onto them
const setLinkDisplayValues = (state, linkDisplayValues) => {
  const { displayValues = {} } = state;
  const updatedDisplayValues = f.reduce(
    (acc, val) => {
      const { values, tableId } = val;
      const linesExist = !f.isEmpty(acc[tableId]);
      return f.assoc(
        tableId,
        f.map(
          f.pick(["id", "values"]),
          linesExist
            ? // Function might be called by "getForeignRows", thus
          // delivering only a subset of existing rows. In this case,
          // we just cache the new values
            f.uniqBy(f.prop("id"), [...acc[tableId], ...values])
            : values
        ),
        acc
      );
    },
    displayValues,
    linkDisplayValues
  );

  return { ...state, displayValues: updatedDisplayValues };
};

const toggleSelectedCell = (state, action) => {
  if (action.select !== false) {
    TableauxRouter.selectCellHandler(
      action.tableId,
      action.rowId,
      action.columnId,
      action.langtag
    );
  }
  unlockRow(action.rowId, false);
  return f.flow(
    f.assoc("editing", false),
    f.update("selectedCell", prevSelection =>
      action.select !== false &&
      (prevSelection.rowId !== action.rowId ||
        prevSelection.columnId !== action.columnId ||
        prevSelection.langtag !== action.langtag)
        ? f.pick(["rowId", "columnId", "langtag"], action)
        : {}
    )
  )(state);
};

const toggleCellEditing = (state, action, completeState) => {
  const { currentTable, selectedCell: { rowId } = {} } = state;
  const tableId = parseInt(currentTable);
  const row = f.find(f.propEq("id", rowId), completeState.rows[tableId].data);
  if (action.editing !== false && row && isLocked(row)) {
    askForSessionUnlock(row);
    return state;
  } else {
    return f.update(
      "editing",
      wasEditing => action.editing !== false && !wasEditing,
      state
    );
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
  const { columnId } = action;
  const { visibleColumns } = state;
  const updatedVisibleColumns = f.includes(columnId, visibleColumns)
    ? f.without([columnId], visibleColumns)
    : f.concat(visibleColumns, columnId);
  return { ...state, visibleColumns: updatedVisibleColumns };
};

const displayValueSelector = ({ tableId, dvRowIdx, columnIdx }) => [
  "displayValues",
  tableId,
  dvRowIdx,
  "values",
  columnIdx
];

const updateDisplayValue = (valueProp, tableView, action, completeState) => {
  const value = f.prop(valueProp, action);
  const { tableId, column } = action;
  console.log(
    "updateDisplayValue",
    JSON.stringify(value),
    column.kind,
    column.multilanguage ? "multilang" : "single lang"
  );
  const [rowIdx, columnIdx, dvRowIdx] = idsToIndices(action, completeState);
  const pathToDv = displayValueSelector({
    tableId,
    dvRowIdx,
    columnIdx
  });
  return f.assoc(pathToDv, getDisplayValue(column, value), tableView);
};

// if an identifier cell was modified, we need to update the concat display value
const maybeUpdateConcat = (tableView, action, completeState) => {
  const concatValues = calcConcatValues(action, completeState) || {};
  const { dvRowIdx, displayValue } = concatValues;
  const pathToDv = displayValueSelector({
    tableId: action.tableId,
    dvRowIdx,
    columnIdx: 0
  });

  return f.isEmpty(concatValues)
    ? tableView
    : f.assoc(pathToDv, displayValue, tableView);
};

export default (state = initialState, action, completeState) => {
  switch (action.type) {
  case TOGGLE_COLUMN_VISIBILITY:
    return toggleSingleColumn(state, action);
  case HIDE_ALL_COLUMNS:
    return { ...state, visibleColumns: [f.head(state.visibleColumns)] };
  case SET_COLUMNS_VISIBLE:
    return { ...state, visibleColumns: action.columnIds };
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
    return toggleCellEditing(state, action, completeState);
  case CELL_SET_VALUE:
    return updateDisplayValue("newValue", state, action, completeState);
  case CELL_ROLLBACK_VALUE:
    return updateDisplayValue("oldValue", state, action, completeState);
  case CELL_SAVED_SUCCESSFULLY:
    return maybeUpdateConcat(state, action, completeState);
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
  case SET_FILTERS_AND_SORTING:
    return {
      ...state,
      filters: action.filters,
      sorting: action.sorting
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
  console.log("preparedRows:", preparedRows);
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
