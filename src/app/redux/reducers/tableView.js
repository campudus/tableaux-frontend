import f from "lodash/fp";

import Worker from "./worker?worker";
import { DefaultLangtag } from "../../constants/TableauxConstants";
import {
  calcConcatValues,
  getUpdatedCellValueToSet,
  idsToIndices
} from "../redux-helpers";
import {
  ifElse,
  mergeArrays,
  unless,
  mapIndexed
} from "../../helpers/functools";
import ActionTypes from "../actionTypes";
import getDisplayValue from "../../helpers/getDisplayValue";
import { ShowArchived } from "../../archivedRows/helpers";

const {
  TOGGLE_EXPANDED_ROW,
  COPY_CELL_VALUE_TO_CLIPBOARD,
  RERENDER_TABLE
} = ActionTypes.tableView;
const {
  SET_STATE,
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
  ROW_CREATE_SUCCESS,
  SET_FILTERS_AND_SORTING,
  CLEAN_UP,
  SET_COLUMN_ORDERING,
  SET_ANNOTATION_HIGHLIGHT
} = ActionTypes;

const initialState = {
  // selectedCell: {},
  copySource: {},
  editing: false,
  visibleColumns: [],
  columnOrdering: [],
  currentTable: null,
  displayValues: {},
  expandedRowIds: [],
  startedGeneratingDisplayValues: false,
  currentLanguage: DefaultLangtag,
  visibleRows: [],
  filters: [],
  sorting: [],
  showArchived: ShowArchived.hide,
  annotationHighlight: "",
  history: {
    undoQueue: [],
    redoQueue: []
  },
  rerenderTable: ""
};

const mergeDisplayValues = (oldDisplayValues, newDisplayValues) =>
  f.compose(
    f.values,
    f.reduce((accum, { id, values }) => {
      const oldValues = f.prop([id, "values"], accum);
      accum[id] = {
        id,
        values: f.isEmpty(oldValues) ? values : mergeArrays(oldValues, values)
      };
      return accum;
    }, {})
  )([...oldDisplayValues, ...newDisplayValues]);

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
        linesExist ? mergeDisplayValues(acc[tableId], values) : values
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

const toggleExpandedRow = (state, action) => {
  const { rowId } = action;

  return f.update(
    "expandedRowIds",
    ifElse(f.includes(rowId), f.pull(rowId), f.concat(rowId)),
    state
  );
};

const setInitialVisibleColumns = (action, completeState) => state => {
  const isCurrentTable = state.currentTable === action.tableId;
  const isReset = f.get(["globalSettings", "columnsReset"], completeState);
  const isVisibleColumnsEmpty = f.isEmpty(f.get("visibleColumns", state));

  if ((isReset || isVisibleColumnsEmpty) && isCurrentTable) {
    const columns = f.get(["result", "columns"], action);
    const visibleColumns = f.map("id", columns);

    return { ...state, visibleColumns };
  }

  return state;
};

const setInitialColumnOrdering = (action, completeState) => state => {
  const isCurrentTable = state.currentTable === action.tableId;
  const isReset = f.get(["globalSettings", "columnsReset"], completeState);
  const isColumnOrderingEmpty = f.isEmpty(f.get("columnOrdering", state));

  if ((isReset || isColumnOrderingEmpty) && isCurrentTable) {
    const columns = f.get(["result", "columns"], action);
    const columnOrdering = mapIndexed(({ id }, idx) => ({ id, idx }))(columns);

    return { ...state, columnOrdering };
  }

  return state;
};

const displayValueSelector = ({ tableId, dvRowIdx, columnIdx }) => [
  "displayValues",
  tableId,
  dvRowIdx,
  "values",
  columnIdx
];

const updateDisplayValue = (valueProp, tableView, action, completeState) => {
  const value = getUpdatedCellValueToSet(
    action,
    valueProp === "oldValue" /*isRollback*/
  );
  const { tableId, column } = action;
  const [columnIdx, dvRowIdx] = f.tail(idsToIndices(action, completeState));
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
  const { dvRowIdx, displayValue, columnIdx } = concatValues;
  const pathToDv = displayValueSelector({
    tableId: action.tableId,
    dvRowIdx,
    columnIdx
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

const remove = (index, arr) => {
  const removed = f.concat(
    f.slice(0, index, arr),
    f.slice(index + 1, arr.length, arr)
  );
  const element = f.get([index], arr);
  return { removed, element };
};

const undo = (tableId, history) => {
  const { undoQueue, redoQueue } = history;
  const index = f.findLastIndex(
    action => action.tableId === tableId,
    undoQueue
  );
  const { removed, element } = remove(index, undoQueue);
  return {
    undoQueue: removed,
    redoQueue: f.flow(
      switchValues,
      f.concat(redoQueue),
      f.compact,
      limitQueue(50)
    )(element)
  };
};

const redo = (tableId, history) => {
  const { undoQueue, redoQueue } = history;
  const index = f.findLastIndex(
    action => action.tableId === tableId,
    redoQueue
  );
  const { removed, element } = remove(index, redoQueue);
  return {
    redoQueue: removed,
    undoQueue: f.flow(
      switchValues,
      f.concat(undoQueue),
      f.compact,
      limitQueue(50)
    )(element)
  };
};

const modifyHistory = action => state => {
  const { modifyAction, tableId } = action;
  const { history } = state;
  if (!modifyAction) {
    return { ...state, history: push(action, history) };
  }
  const newHistory =
    modifyAction === "undo" ? undo(tableId, history) : redo(tableId, history);
  return { ...state, history: newHistory };
};

export default (state = initialState, action, completeState) => {
  switch (action.type) {
    case SET_STATE:
      return action.state.tableView;
    case TOGGLE_COLUMN_VISIBILITY:
      return f.assoc("visibleColumns", action.visibleColumns, state);
    case HIDE_ALL_COLUMNS:
      return { ...state, visibleColumns: [f.head(state.visibleColumns)] };
    case SET_COLUMNS_VISIBLE:
      return { ...state, visibleColumns: action.columnIds };
    case SET_COLUMN_ORDERING:
      return { ...state, columnOrdering: action.columnIds };
    case SET_CURRENT_TABLE:
      return { ...state, currentTable: action.tableId };
    case COLUMNS_DATA_LOADED:
      return f.compose(
        setInitialVisibleColumns(action, completeState),
        setInitialColumnOrdering(action, completeState)
      )(state);
    case GENERATED_DISPLAY_VALUES:
      return setLinkDisplayValues(state, action.displayValues);
    case ADDITIONAL_ROWS_DATA_LOADED:
      return insertSkeletonLinks(state, action, completeState);
    case ROW_CREATE_SUCCESS:
      return insertSkeletonLinks(
        state,
        { ...action, rows: [action.result] },
        completeState
      );

    case START_GENERATING_DISPLAY_VALUES:
      return { ...state, startedGeneratingDisplayValues: true };
    case SET_CURRENT_LANGUAGE:
      return state.currentLanguage === action.lang
        ? state
        : { ...state, currentLanguage: action.lang };
    // case TOGGLE_CELL_SELECTION:
    //   return toggleSelectedCell(state, action);
    case TOGGLE_EXPANDED_ROW:
      return toggleExpandedRow(state, action);
    // case TOGGLE_CELL_EDITING:
    //   return toggleCellEditing(state, action, completeState);
    // Do not clear copySource on table switch! User might want to copy values between tables.
    case COPY_CELL_VALUE_TO_CLIPBOARD:
      return f.assoc("copySource", f.pick(["cell", "langtag"], action), state);
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
        worker: new Worker()
      };
    case ALL_ROWS_DATA_LOADED: {
      const { currentTable } = state.currentTable;
      const { rows } = f.get(["rows", currentTable, "data"]);
      return {
        ...state,
        visibleRows: f.flow(f.keys, f.map(f.toInteger))(rows)
      };
    }
    case SET_ANNOTATION_HIGHLIGHT:
      return {
        ...state,
        annotationHighlight: action.annotationHighlight
      };
    case SET_FILTERS_AND_SORTING:
      return {
        ...state,
        filters: action.filters ?? state.filters,
        sorting: action.sorting ?? state.sorting,
        showArchived: action.showArchived ?? state.showArchived,
        expandedRowIds: []
      };
    case CLEAN_UP:
      return {
        ...state,
        filters: [],
        sorting: [],
        columnOrdering: [],
        displayValues: {},
        history: [],
        expandedRowIds: [],
        visibleColumns: [],
        annotationHighlight: ""
      };
    case RERENDER_TABLE:
      return {
        ...state,
        rerenderTable: !state.rerenderTable
      };
    default:
      return state;
  }
};

export const selectShowArchivedState = store => store.tableView?.showArchived;
export const selectAnnotationHighlight = store =>
  store.tableView?.annotationHighlight;
