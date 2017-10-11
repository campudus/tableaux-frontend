/**
 * A LIFO event listener that watches cell changes
 */

import f from "lodash/fp";
import Dispatcher from "../../../dispatcher/Dispatcher";
import {ActionTypes} from "../../../constants/TableauxConstants";
import {changeCell} from "../../../models/Tables";

const MAX_UNDO_STEPS = 50;

const undoStacks = {};
let currentTable;

Dispatcher.on(ActionTypes.SWITCH_TABLE, setCurrentTable);

export const setCurrentTable = (tableId) => {
  currentTable = tableId;
};

const getCurrentStack = () => f.getOr([], currentTable, undoStacks);

const push = (data) => {
  undoStacks[currentTable] = f.flow(
    (s) => [...s, data],
    f.takeRight(MAX_UNDO_STEPS)
  )(getCurrentStack());
};

const pop = () => {
  const stack = getCurrentStack();
  undoStacks[currentTable] = f.dropRight(1, stack);
  return f.last(stack);
};

export const peek = () => f.last(getCurrentStack());

export async function undo() {
  const {cell, value} = peek() || {};
  if (f.any(f.isNil, [cell, value])) {
    return;
  }
  await changeCell({cell, value, options: {type: "UNDO"}});
  return pop();
}

export const remember = ({cell, value}) => {
  const {tableId} = cell;
  setCurrentTable(tableId);
  push({
    cell,
    value
  });
};
