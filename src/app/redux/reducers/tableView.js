import ActionTypes from "../actionTypes";
import f from "lodash/fp";
import { DefaultLangtag } from "../../constants/TableauxConstants";
import { setUrlBarToCell } from "../../helpers/browserNavigation";

const { TOGGLE_CELL_SELECTION, TOGGLE_CELL_EDITING } = ActionTypes.tableView;

const initalState = {
  langtag: DefaultLangtag,
  selectedCell: {},
  editing: false,
  expandedRows: [],
  contextMenuOpen: false,
};

const toggleSelectedCell = (state, action) => {
  if (action.pushHistory !== false && action.select !== false) {
    setUrlBarToCell({
      tableId: action.tableId,
      rowId: action.rowId,
      columnId: action.columnId,
      langtag: action.langtag || state.tableView.langtag,
    });
  }
  // TODO: unlock row
  return f.update(
    "selectedCell",
    prevSelection =>
      action.select !== false &&
      (prevSelection.rowId !== action.rowId ||
        prevSelection.columnId !== action.columnId)
        ? f.pick(["rowId", "columnId"], action)
        : {},
    state
  );
};

const toggleCellEditing = (state, action) => {
  // TODO: Check if editable
  return f.update(
    "editing",
    wasEditing => action.editing !== false && !wasEditing,
    state
  );
};

const tableView = (state = initialState, action) => {
  switch (action.type) {
    case TOGGLE_CELL_SELECTION:
      return toggleCellSelection(state, action);
    case TOGGLE_CELL_EDITING:
      return togleCellEditing(state, action);
    default:
      return state;
  }
};
