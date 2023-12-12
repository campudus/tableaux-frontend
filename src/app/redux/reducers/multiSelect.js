import f from "lodash/fp";
import actionTypes from "../actionTypes";

const Action = actionTypes.multiSelect;

const initialState = [];

const toggleInArray = (el, toKey, coll) => {
  const elementKey = toKey(el);
  const elementExists = coll.find(e => toKey(e) === elementKey);

  return elementExists
    ? coll.filter(e => toKey(e) !== elementKey)
    : [...(coll ?? initialState), el];
};

const findSelectedCell = store => {
  const tableId = f.prop("tableView.currentTable", store);
  const { columnId, rowId } = f.propOr({}, "selectedCell.selectedCell", store);
  const columnIdx = f
    .prop(`columns.${tableId}.data`, store)
    ?.findIndex(col => col.id === columnId);
  return f.compose(
    f.prop(`cells.${columnIdx}`),
    f.find(f.whereEq({ id: rowId })),
    f.prop(`rows.${tableId}.data`)
  )(store);
};

const selectReducer = actionMap => (...args) => {
  const [state, { type }] = args;
  const fn = actionMap[type] ?? (() => state ?? initialState);
  return fn(...args);
};

const whenClipboardNotEmpty = fn => (...args) => {
  const [_state, _action, store] = args;
  const hasCopySource = !f.isEmpty(f.prop("tableView.copySource", store));
  return hasCopySource ? fn(...args) : initialState;
};

const toggleMultiselectCell = (state = initialState, action, store) => {
  const { cell } = action;
  const multiselect = f.isEmpty(state)
    ? f.uniqBy("id", [cell, findSelectedCell(store)])
    : toggleInArray(cell, f.prop("id"), state);

  console.log({ multiselect });
  return multiSelect;
};

const toggleMultiselectArea = (state = initialState, action, store) => {
  const { cells } = action;
};

const clearMultiSelect = () => initialState;

export const multiSelect = selectReducer({
  [actionTypes.SET_CURRENT_TABLE]: clearMultiSelect,
  [Action.CLEAR_MULTISELECT]: clearMultiSelect,
  [Action.TOGGLE_MULTISELECT_AREA]: whenClipboardNotEmpty(
    toggleMultiselectArea
  ),
  [Action.TOGGLE_MULTISELECT_CELL]: whenClipboardNotEmpty(toggleMultiselectCell)
});
