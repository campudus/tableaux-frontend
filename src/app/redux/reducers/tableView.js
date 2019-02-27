import f from "lodash/fp";

import { DefaultLangtag } from "../../constants/TableauxConstants";
import { idsToIndices, calcConcatValues } from "../redux-helpers";
import { ifElse, unless } from "../../helpers/functools";
import { isLocked, unlockRow } from "../../helpers/annotationHelper";
import ActionTypes from "../actionTypes";
import TableauxRouter from "../../router/router";
import askForSessionUnlock from "../../components/helperComponents/SessionUnlockDialog";
import getDisplayValue from "../../helpers/getDisplayValue";

const {
  TOGGLE_CELL_SELECTION,
  TOGGLE_CELL_EDITING,
  TOGGLE_EXPANDED_ROW
} = ActionTypes.tableView;
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
  ADDITIONAL_ROWS_DATA_LOADED,
  SET_FILTERS_AND_SORTING,
  CLEAN_UP
} = ActionTypes;

const initialState = {
  selectedCell: {},
  editing: false,
  visibleColumns: [],
  currentTable: null,
  displayValues: {},
  expandedRowIds: [],
  startedGeneratingDisplayValues: false,
  currentLanguage: DefaultLangtag,
  visibleRows: [],
  filters: [],
  sorting: [],
  searchOverlayOpen: false,
  history: {
    undoQueue: [],
    redoQueue: []
  }
};

// This sets display values for foreign tables, allowing us to track
// changes made by entity views onto them
const setLinkDisplayValues = (state, linkDisplayValues) => {
  const { displayValues = {} } = state;
  const updatedDisplayValues = f.reduce(
    (acc, val) => {
      const { values, tableId } = val;
      const linesExist = !f.isEmpty(acc[tableId]);
      acc[tableId] = f.map(
        f.pick(["id", "values"]),
        linesExist
          ? // Function might be called by "getForeignRows", thus
            // delivering only a subset of existing rows. In this case,
            // we just cache the new values
            f.uniqBy(f.prop("id"), [...acc[tableId], ...values])
          : values
      );
      return acc;
    },
    displayValues,
    linkDisplayValues
  );

  return {
    ...state,
    displayValues: updatedDisplayValues,
    startedGeneratingDisplayValues: false
  };
};

const insertSkeletonLinks = (state, action, completeState) => {
  const { rows, tableId } = action;
  const columns = f.prop(["columns", tableId, "data"], completeState);

  const linkColumns = columns
    .map((el, idx) => ({ ...el, idx }))
    .filter(f.propEq("kind", "link"));

  // get displayValues for all linked items
  const linksOfLinks = linkColumns.reduce((accum, { toTable }) => {
    accum[toTable] = {};
    return accum;
  }, {});

  // Use in-place mutation to generate dependent displayValues for performance reasons
  rows.forEach(row =>
    linkColumns.forEach(({ toTable, idx, toColumn }) => {
      const linkValues = row.values[idx];
      linkValues.forEach(
        ({ id, value }) =>
          !linksOfLinks[toTable][id] &&
          (linksOfLinks[toTable][id] = getDisplayValue(toColumn, value))
      );
    })
  );

  const linksOfLinksAsRows = f.keys(linksOfLinks).map(tableId => {
    const tableDisplayValues = f.keys(linksOfLinks[tableId]).map(id => ({
      id: parseInt(id),
      values: unless(f.isArray, el => [el], linksOfLinks[tableId][id])
    }));
    return { tableId: parseInt(tableId), values: tableDisplayValues };
  });

  const asLinkFormat = [
    {
      tableId,
      values: rows.map(({ id, values }) => ({
        id,
        values: values.map((value, idx) => getDisplayValue(columns[idx], value))
      }))
    },
    ...linksOfLinksAsRows
  ];

  return setLinkDisplayValues(state, asLinkFormat);
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

const toggleExpandedRow = (state, action) => {
  const { rowId } = action;

  return f.update(
    "expandedRowIds",
    ifElse(f.includes(rowId), f.pull(rowId), f.concat(rowId)),
    state
  );
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
  f.isEmpty(f.get("visibleColumns", state))
    ? f.flow(
        f.prop(["result", "columns"]),
        f.slice(0, 10),
        f.map("id"),
        ids => f.assoc("visibleColumns")(ids)(state)
      )(action)
    : state;

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
  const [rowIdx, columnIdx, dvRowIdx] = idsToIndices(action, completeState);
  const pathToDv = displayValueSelector({
    tableId,
    dvRowIdx,
    columnIdx
  });
  return f.assoc(pathToDv, getDisplayValue(column, value), tableView);
};

// if an identifier cell was modified, we need to update the concat display value
const maybeUpdateConcat = f.curryN(3, (action, completeState, tableView) => {
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
});

const switchValues = action => ({
  ...action,
  oldValue: action.newValue,
  newValue: action.oldValue
});

const limitQueue = limit => queue =>
  queue.length >= limit ? f.tail(queue) : queue;

const push = (action, history) => {
  return {
    ...history,
    undoQueue: f.flow(
      switchValues,
      f.concat(history.undoQueue),
      f.compact,
      limitQueue(50)
    )(action)
  };
};
const undo = history => {
  const { undoQueue, redoQueue } = history;
  return {
    undoQueue: f.initial(undoQueue),
    redoQueue: f.flow(
      f.last,
      switchValues,
      f.concat(redoQueue),
      f.compact,
      limitQueue(50)
    )(undoQueue)
  };
};
const redo = history => {
  const { undoQueue, redoQueue } = history;
  return {
    redoQueue: f.initial(redoQueue),
    undoQueue: f.flow(
      f.last,
      switchValues,
      f.concat(undoQueue),
      f.compact,
      limitQueue(50)
    )(redoQueue)
  };
};

const modifyHistory = action => state => {
  const { modifyAction } = action;
  const { history } = state;
  if (!modifyAction) {
    return { ...state, history: push(action, history) };
  }
  const newHistory = modifyAction === "undo" ? undo(history) : redo(history);
  return { ...state, history: newHistory };
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
    case ADDITIONAL_ROWS_DATA_LOADED:
      return insertSkeletonLinks(state, action, completeState);
    case START_GENERATING_DISPLAY_VALUES:
      return { ...state, startedGeneratingDisplayValues: true };
    case SET_CURRENT_LANGUAGE:
      return state.currentLanguage === action.lang
        ? state
        : { ...state, currentLanguage: action.lang };
    case TOGGLE_CELL_SELECTION:
      return toggleSelectedCell(state, action);
    case TOGGLE_EXPANDED_ROW:
      return toggleExpandedRow(state, action);
    case TOGGLE_CELL_EDITING:
      return toggleCellEditing(state, action, completeState);
    case CELL_SET_VALUE:
      return updateDisplayValue("newValue", state, action, completeState);
    case CELL_ROLLBACK_VALUE:
      return updateDisplayValue("oldValue", state, action, completeState);
    case CELL_SAVED_SUCCESSFULLY:
      return f.flow(
        modifyHistory(action),
        maybeUpdateConcat(action, completeState)
      )(state);
    case SET_DISPLAY_VALUE_WORKER:
      return {
        ...state,
        worker: new Worker("/worker.bundle.js")
      };
    case ALL_ROWS_DATA_LOADED: {
      const { currentTable } = state.currentTable;
      const { rows } = f.get(["rows", currentTable, "data"]);
      return {
        ...state,
        visibleRows: f.flow(
          f.keys,
          f.map(f.toInteger)
        )(rows)
      };
    }
    case SET_FILTERS_AND_SORTING:
      return {
        ...state,
        filters: action.filters || state.filters,
        sorting: action.sorting || state.sorting
      };
    case CLEAN_UP:
      return {
        ...state,
        filters: [],
        sorting: [],
        displayValues: {},
        history: []
      };
    default:
      return state;
  }
};
