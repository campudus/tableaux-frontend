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
  return f.isEmpty(state)
    ? f.uniqBy("id", [findSelectedCell(store), cell])
    : toggleInArray(cell, f.prop("id"), state);
};

const toggleMultiselectArea = (_state = initialState, action, store) => {
  const { cell, columns, rows } = action;
  const selectedCell = f.prop("selectedCell.selectedCell", store);

  return f.isEmpty(selectedCell)
    ? []
    : getCellRectangle(columns, rows, selectedCell, cell);
};

const getCellRectangle = (columns, rows, selectedCell, cell) => {
  const findOrderedIndices = (coll, ...ids) =>
    ids.map(id => coll.findIndex(f.whereEq({ id }))).sort((a, b) => a - b);
  const [startX, endX] = findOrderedIndices(
    columns,
    selectedCell.columnId,
    cell.column.id
  );
  const [startY, endY] = findOrderedIndices(
    rows,
    selectedCell.rowId,
    cell.row.id
  );

  const selectedCells = [];

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const selectedRow = rows[y];
      const selectedColumn = columns[x];
      const selectedCell = f.find(
        f.propEq("column.id", selectedColumn.id),
        selectedRow.cells
      );

      selectedCells.push(selectedCell);
    }
  }

  return selectedCells;
};

const clearMultiSelect = () => initialState;

export default selectReducer({
  [actionTypes.SET_CURRENT_TABLE]: clearMultiSelect,
  [Action.CLEAR_MULTISELECT]: clearMultiSelect,
  [Action.TOGGLE_MULTISELECT_AREA]: whenClipboardNotEmpty(
    toggleMultiselectArea
  ),
  [Action.TOGGLE_MULTISELECT_CELL]: whenClipboardNotEmpty(toggleMultiselectCell)
});
