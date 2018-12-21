import ActionTypes from "../actionTypes";
import f from "lodash/fp";
import { DefaultLangtag, langtags } from "../../constants/TableauxConstants";
import { setUrlBarToCell } from "../../helpers/browserNavigation";
import { checkOrThrow } from "../../specs/type";

const { TOGGLE_CELL_SELECTION, TOGGLE_CELL_EDITING } = ActionTypes.tableView;

const initialState = {
  selectedCell: {},
  editing: false
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

export default (state = initialState, action) => {
  switch (action.type) {
    case TOGGLE_CELL_SELECTION:
      return toggleSelectedCell(state, action);
    case TOGGLE_CELL_EDITING:
      return toggleCellEditing(state, action);
    default:
      return state;
  }
};
