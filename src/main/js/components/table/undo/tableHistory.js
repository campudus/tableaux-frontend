/**
 * A listener using two LIFO queues to watch cell changes and provide undo/redo
 *
 * Exports functions
 *
 * remember: (cell: Cell, value: object) -> void
 *     saves a cell state to undo history
 * undo: (void) -> future({cell: Cell, value: object})
 *     undoes the last cell change in the current table, up to MAX_UNDO_STEPS
 *     returns the applied change
 * redo: (void) -> future({cell: Cell, value: object})
 *     redoes the last undone cell change in the current table, up to MAX_UNDO_STEPS
 *     returns the applied change
 * canUndo: (void) -> bool
 *     checks if there are any elements on the current table's undo stack
 * canRedo: (void) -> bool
 *     checks if there are any elements on the current table's redo stack
 */

import f from "lodash/fp";
import Dispatcher from "../../../dispatcher/Dispatcher";
import {ActionTypes} from "../../../constants/TableauxConstants";
import * as ActionCreator from "../../../actions/ActionCreator";
import changeCell from "../../../models/helpers/changeCell";

const MAX_UNDO_STEPS = 50;

const undoStacks = {};
const redoStacks = {};
let currentTable;

Dispatcher.on(ActionTypes.SWITCH_TABLE, setCurrentTable);

export const setCurrentTable = (tableId) => {
  if (tableId !== currentTable) {
    delete undoStacks[currentTable];
    delete redoStacks[currentTable];
  }
  currentTable = tableId;
};

const getCurrentStack = (stacks) => f.getOr([], currentTable, stacks);
const updateCurrentStack = (stacks, fn) => {
  const stack = getCurrentStack(stacks);
  stacks[currentTable] = fn(stack);
};

const push = (stacks, data) => {
  const pushAndTrim = f.flow(
    (s) => [...s, data],
    f.takeRight(MAX_UNDO_STEPS)
  );
  updateCurrentStack(stacks, pushAndTrim);
};

const pop = (stacks) => {
  const stack = getCurrentStack(stacks);
  const tail = f.last(stack);
  updateCurrentStack(stacks, f.dropRight(1));
  return tail;
};

const peek = (stacks) => f.last(getCurrentStack(stacks));

export const canUndo = () => !!peek(undoStacks);
export const canRedo = () => !!peek(redoStacks);

export async function undo() {
  return popAndApply(undoStacks);
}

export async function redo() {
  return popAndApply(redoStacks);
}

async function popAndApply(stacks) {
  const item = peek(stacks);
  if (f.isNil(item)) {
    return;
  }
  const isUndo = stacks === undoStacks;
  const {cell, value} = item;
  ActionCreator.toggleCellSelection(cell, true); // do that here to feel more responsive
  const complementaryStack = (isUndo) ? redoStacks : undoStacks;
  push(complementaryStack, {cell, value: f.clone(cell.value)});
  await changeCell({cell, value, options: {type: "UNDO"}});
  return pop(stacks);
}

export const remember = ({cell, value}) => {
  const {tableId} = cell;
  setCurrentTable(tableId);
  push(undoStacks, {
    cell,
    value
  });
};
