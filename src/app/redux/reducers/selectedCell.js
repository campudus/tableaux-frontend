import f from "lodash/fp";
import { isLocked, unlockRow } from "../../helpers/annotationHelper";
import askForSessionUnlock from "../../components/helperComponents/SessionUnlockDialog";
import ActionTypes from "../actionTypes";
const { TOGGLE_CELL_SELECTION, TOGGLE_CELL_EDITING, SET_PREVENT_CELL_SELECTION } = ActionTypes.tableView;

const initialState = { selectedCell: {}, preventCellSelection: false };

export default (state = initialState, action, completeState) => {
  switch (action.type) {
    case TOGGLE_CELL_SELECTION:
      return toggleSelectedCell(state, action);
    case TOGGLE_CELL_EDITING:
      return toggleCellEditing(state, action, completeState);
    case SET_PREVENT_CELL_SELECTION:
      return setPreventCellSelection(state, action);
    default:
      return state;
  }
};

const setPreventCellSelection = (state, action) => {
  const { value } = action
  return { ...state, preventCellSelection: value }
}

const toggleCellEditing = (state, action, completeState) => {
  const { selectedCell: { rowId, columnId } = {} } = state;
  const {
    tableView: { currentTable }
  } = completeState;
  const tableId = parseInt(currentTable);
  const row = f.find(f.propEq("id", rowId), completeState.rows[tableId].data);
  if (action.editing !== false && row && isLocked(row)) {
    askForSessionUnlock(row);
    return state;
  } else {
    const column = f.find(
      f.propEq("id", columnId),
      completeState.columns[tableId].data
    );
    // languages don't automatically match countries, so country cells should not switch to edit mode when expanded
    const shouldStayClosed =
      column.multilanguage &&
      column.languageType === "country" &&
      f.contains(rowId, state.expandedRowIds);
    return shouldStayClosed
      ? state
      : f.update(
        "editing",
        wasEditing => action.editing !== false && !wasEditing,
        state
      );
  }
};

const toggleSelectedCell = (state, action) => {
  if (state.preventCellSelection) return state;
  unlockRow(action.rowId, false);
  return f.flow(
    f.assoc("editing", false),
    f.update("selectedCell", prevSelection =>
      (action.select !== false &&
        (prevSelection.rowId !== action.rowId ||
          prevSelection.columnId !== action.columnId ||
          prevSelection.langtag !== action.langtag)) ||
        prevSelection.align !== action.align
        ? f.pick(["rowId", "columnId", "langtag", "align"], action)
        : {}
    )
  )(state);
};
