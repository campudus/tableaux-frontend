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
  return toggleInArray(cell, f.prop("id"), state);
};

const toggleMultiselectArea = (state = initialState, action, store) => {
  const { cells } = action;
};

export const multiSelect = selectReducer({
  [Action.TOGGLE_MULTISELECT_AREA]: whenClipboardNotEmpty(
    toggleMultiselectArea
  ),
  [Action.TOGGLE_MULTISELECT_CELL]: whenClipboardNotEmpty(toggleMultiselectCell)
});
