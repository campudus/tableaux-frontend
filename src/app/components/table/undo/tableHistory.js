/**
 * A listener using two LIFO queues to watch cell changes and provide undo/redo
 *
 * Exports functions
 *
 * remember: ({tableId: number, rowId: number}, cell: Cell, value: object) -> void
 *     saves a cell state to undo history
 * undo: ({tableId: number, rowId: number}) -> future({cell: Cell, value: object})
 *     undoes the last cell change in the current table, up to MAX_UNDO_STEPS
 *     returns the applied change
 * redo: ({tableId: number, rowId: number}) -> future({cell: Cell, value: object})
 *     redoes the last undone cell change in the current table, up to MAX_UNDO_STEPS
 *     returns the applied change
 * canUndo: ({tableId: number, rowId: number}) -> bool
 *     checks if there are any elements on the current table's undo stack
 * canRedo: ({tableId: number, rowId: number}) -> bool
 *     checks if there are any elements on the current table's redo stack
 */

import f from "lodash/fp";
// import * as ActionCreator from "../../../actions/ActionCreator";
// import changeCell from "../../../models/helpers/changeCell";

const MAX_UNDO_STEPS = 50;

const stacks = {
  undo: [],
  redo: []
};

let tableCollection = null;

const getViewOfStack = ({ tableId, rowId }, stackName) =>
  f.filter(
    ({ cell }) =>
      tableId === cell.tableId && (f.isNil(rowId) || rowId === cell.rowId),
    f.get(stackName, stacks)
  );

const push = (stackName, data) => {
  const pushAndTrim = f.flow(
    s => [...s, data],
    f.takeRight(MAX_UNDO_STEPS)
  );
  updateStack(stackName, pushAndTrim);
  reportStacks("push");
};

const updateStack = (stackName, fn) => {
  stacks[stackName] = fn(stacks[stackName]);
};

const pop = (view, stackName) => {
  const stackView = getViewOfStack(view, stackName);
  const tail = f.last(stackView);
  updateStack(stackName, f.remove(f.eq(tail)));
  reportStacks("pop");
  return tail;
};

const peek = (view, stackName) => f.last(getViewOfStack(view, stackName));

export const canUndo = view => !f.isEmpty(getViewOfStack(view, "undo"));

export const canRedo = view => !f.isEmpty(getViewOfStack(view, "redo"));

export async function undo(view) {
  return popAndApply(view, "undo");
}

export async function redo(view) {
  return popAndApply(view, "redo");
}

async function popAndApply(view, stackName) {
  if (f.isNil(tableCollection)) {
    window.error(
      "Tried to apply table history before initializing the table collection!"
    );
    return;
  }

  const item = peek(view, stackName);
  if (f.isNil(item)) {
    return;
  }

  const isUndo = stackName === "undo";
  const { cell, value } = item;
  // ActionCreator.toggleCellSelection(cell, true); // do that here to feel more responsive
  const complementaryStack = isUndo ? "redo" : "undo";
  push(complementaryStack, { cell, value: f.clone(cell.value) });
  // Table might have been switched away and back; in this case cells have been reloaded, so we can't rely on
  // the stored cell reference
  const possiblyReloadedCell = tableCollection
    .get(cell.tableId)
    .rows.get(cell.row.id)
    .cells.get(cell.id);
  const applied = pop(view, stackName);
  return applied;
}

const reportStacks =
  process.env.NODE_ENV === "production"
    ? f.noop
    : action => {
        if (process.env.NODE_ENV !== "production") {
          const undoVals = f.map(
            f.flow(
              f.props(["value", ["cell", "id"]]),
              f.join(" in ")
            ),
            stacks.undo
          );
          const redoVals = f.map(
            f.flow(
              f.props(["value", ["cell", "id"]]),
              f.join(" in ")
            ),
            stacks.redo
          );
        }
      };

export const remember = ({ cell, value }) => {
  const { tableId } = cell;
  push("undo", {
    cell,
    value: f.clone(value)
  });
  // ActionCreator.broadcastHistoryEvent(canUndo({tableId}), canRedo({tableId}));
};

export const initHistoryOf = tables => {
  tableCollection = tables;
};
