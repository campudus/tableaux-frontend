import f from "lodash/fp";
import React from "react";
import {
  ColumnKinds,
  DefaultLangtag,
  Directions,
  Langtags
} from "../../constants/TableauxConstants";
import { KEYBOARD_TABLE_HISTORY } from "../../FeatureFlags";
import { canUserChangeCell } from "../../helpers/accessManagementHelper";
import { isLocked } from "../../helpers/annotationHelper";
import CustomEvent from "../../helpers/CustomEvent";
import { doto, maybe, memoizeWith, unless } from "../../helpers/functools";
import { getModifiers } from "../../helpers/modifierState";
import { getTableDisplayName } from "../../helpers/multiLanguage";
import { clearSelectedCellValue } from "../../redux/actions/cellActions";
import store from "../../redux/store";
import AttachmentOverlay from "../cells/attachment/AttachmentOverlay";
import pasteCellValue from "../cells/cellCopyHelper";
import { openLinkOverlay } from "../cells/link/LinkOverlay";
import TextEditOverlay from "../cells/text/TextEditOverlay";
import { OpenFilterEvent } from "../header/filter/Filter";
import Header from "../overlay/Header";

const tableColumnKey = (tableId, columnId) => `${tableId}-${columnId}`;
const lookUpCellKind = memoizeWith(tableColumnKey, (tableId, columnId) =>
  doto(
    store.getState(),
    f.prop(["columns", tableId, "data"]),
    f.find(f.propEq("id", columnId)),
    f.prop("kind")
  )
);
const getCellKind = ({ currentTable, selectedCell }) =>
  f.isEmpty(selectedCell)
    ? null
    : lookUpCellKind(currentTable, selectedCell.columnId);

export function getKeyboardShortcuts() {
  const { actions, tableView } = this.props;
  const { currentTable } = tableView;
  const {
    selectedCell: { selectedCell }
  } = store.getState();
  const selectedCellEditing = tableView.editing;
  const { cell, langtag } = selectedCell;

  const clearVisibleCellValue = () => {
    if (
      canUserChangeCell(cell, langtag) &&
      cell.column.kind !== ColumnKinds.group
    ) {
      clearSelectedCellValue(cell, langtag);
    }
  };

  return {
    backspace: _ => {
      clearVisibleCellValue();
    },
    delete: _ => {
      clearVisibleCellValue();
    },
    left: event => {
      event.preventDefault();
      preventSleepingOnTheKeyboard.call(this, () => {
        setNextSelectedCell.call(this, Directions.LEFT);
      });
    },
    right: event => {
      event.preventDefault();
      preventSleepingOnTheKeyboard.call(this, () => {
        setNextSelectedCell.call(this, Directions.RIGHT);
      });
    },
    tab: event => {
      event.preventDefault();
      preventSleepingOnTheKeyboard.call(this, () => {
        setNextSelectedCell.call(
          this,
          getModifiers(event).shift ? Directions.LEFT : Directions.RIGHT
        );
      });
    },
    up: event => {
      event.preventDefault();
      preventSleepingOnTheKeyboard.call(this, () => {
        setNextSelectedCell.call(this, Directions.UP);
      });
    },
    down: event => {
      event.preventDefault();
      preventSleepingOnTheKeyboard.call(this, () => {
        setNextSelectedCell.call(this, Directions.DOWN);
      });
    },
    enter: event => {
      event.preventDefault();
      preventSleepingOnTheKeyboard.call(this, () => {
        if (
          isLastRowSelected.call(this) &&
          selectedCellEditing &&
          getModifiers(event).shift
        ) {
          createAndSelectNewRow.call(this);
        } else if (selectedCell) {
          toggleCellEditing.call(this, {
            langtag: selectedCell.langtag || this.props.langtag,
            event
          });
        }
      });
    },
    escape: event => {
      event.preventDefault();
      preventSleepingOnTheKeyboard.call(this, () => {
        if (selectedCell && selectedCellEditing) {
          toggleCellEditing.call(this, {
            editing: false,
            event
          });
        }
      });
    },
    text: event => {
      if (!selectedCell) {
        return;
      }
      const modifiers = getModifiers(event);
      const cellKind = getCellKind({ currentTable, selectedCell });
      const hasActionKey = modifiers.mod;
      const isKeyPressed = k =>
        k >= "A" && k <= "Z"
          ? f.matchesProperty("key", k)(event) ||
            (f.matchesProperty("key", f.toLower(k))(event) && modifiers.shift)
          : f.matchesProperty("key", k)(event);

      const systemPaste =
        selectedCellEditing &&
        f.contains(cellKind, [
          ColumnKinds.text,
          ColumnKinds.richtext,
          ColumnKinds.shorttext,
          ColumnKinds.numeric
        ]);

      if (hasActionKey && isKeyPressed("f")) {
        event.preventDefault();
        if (selectedCell && selectedCellEditing) {
          toggleCellEditing.call(this, {
            editing: false,
            event
          });
        }
        CustomEvent.emit(
          OpenFilterEvent,
          {
            filters: ["any-value", "contains", ""]
          },
          document.body
        );
      } else if (
        hasActionKey &&
        isKeyPressed("c") &&
        cellKind !== ColumnKinds.concat &&
        !isTextSelected()
      ) {
        // Cell copy
        event.preventDefault();
        event.stopPropagation();
        copySelectedCell.call(this);
      } else if (
        !f.isEmpty(this.props.tableView.copySource) &&
        !f.eq(this.props.tableView.copySource, selectedCell) &&
        hasActionKey &&
        isKeyPressed("v") &&
        !systemPaste
      ) {
        // Cell paste
        event.preventDefault();
        event.stopPropagation();
        pasteSelectedCell.call(this);
      } else if (
        KEYBOARD_TABLE_HISTORY &&
        hasActionKey &&
        (isKeyPressed("z") || isKeyPressed("Z"))
      ) {
        event.preventDefault();
        event.stopPropagation();
        // note upper/lower case!
        if (!selectedCellEditing) {
          const undoFn = isKeyPressed("Z")
            ? () => actions.modifyHistory("redo", tableView.currentTable)
            : () => actions.modifyHistory("undo", tableView.currentTable);
          undoFn();
        }
      } else if (
        KEYBOARD_TABLE_HISTORY &&
        isKeyPressed("y") &&
        modifiers.mod &&
        !selectedCellEditing
      ) {
        event.preventDefault();
        event.stopPropagation();
        actions.modifyHistory("redo", tableView.currentTable);
      } else if (
        !selectedCellEditing && // Other keypress
        modifiers.none &&
        (cellKind === ColumnKinds.text ||
          cellKind === ColumnKinds.shorttext ||
          cellKind === ColumnKinds.richtext ||
          cellKind === ColumnKinds.numeric)
      ) {
        toggleCellEditing.call(this);
      }
    }
  };
}

export function isTextSelected() {
  // should be supported above ie9?
  const userSelection = maybe(window)
    .exec("getSelection")
    .map(f.get("type"))
    .getOrElse("not supported");
  return userSelection === "Range";
}

export function isLastRowSelected() {
  const { rows } = this.props;
  const {
    selectedCell: { selectedCell }
  } = store.getState();
  const currentRowId = selectedCell.rowId;
  const numberOfRows = f.size(rows);
  const isTableEmpty = numberOfRows <= 0;
  const currentRowIndex = f.findIndex(row => row.id === currentRowId, rows);

  return isTableEmpty || currentRowIndex === numberOfRows - 1;
}

export function toggleCellSelection({ cell, langtag }) {
  const { actions, tableView, setSelectedCellExpandedRow } = this.props;
  const tableId = tableView.currentTable;
  const validLangtag = langtag || this.props.langtag;
  const columnId = cell.columnId;
  const rowId = cell.rowId;

  actions.toggleCellSelection({
    columnId,
    rowId,
    langtag: validLangtag,
    tableId
  });

  setSelectedCellExpandedRow(langtag);
}

export function toggleCellEditing(params = {}) {
  const editVal = f.isBoolean(params.editing) ? params.editing : true;
  const { columns, rows, tableView, actions } = this.props;
  const visibleColumns = f.filter(col => col.visible || col.id === 0, columns);
  const { currentTable } = tableView;
  const {
    selectedCell: {
      selectedCell: { columnId, rowId, langtag }
    }
  } = store.getState();

  const columnIndex = f.findIndex(col => col.id === columnId, visibleColumns);
  const rowIndex = f.findIndex(row => row.id === rowId, rows);

  const selectedColumn = visibleColumns[columnIndex];
  const selectedRow = rows[rowIndex];

  const selectedCellObject = this.getCell(rowIndex, columnIndex);
  const canEdit = canUserChangeCell(selectedCellObject, langtag);
  if (canEdit && selectedCellObject) {
    const selectedCellDisplayValues = selectedCellObject.displayValue;
    const selectedCellRawValue = selectedCellObject.value;
    const selectedCellKind = selectedCellObject.kind;
    const table = selectedCellObject.table;

    actions.toggleCellEditing({ editing: editVal, row: selectedRow });

    if (!isLocked(selectedRow) && editVal) {
      switch (selectedCellKind) {
        case ColumnKinds.boolean:
          actions.changeCellValue({
            tableId: currentTable,
            column: selectedColumn,
            columnId: columnId,
            rowId: rowId,
            oldValue: selectedCellRawValue,
            newValue: selectedCellObject.isMultiLanguage
              ? { [langtag]: !selectedCellRawValue }
              : !selectedCellRawValue,
            kind: selectedCellKind
          });
          break;
        case ColumnKinds.link:
          openLinkOverlay({
            cell: selectedCellObject,
            langtag: langtag,
            actions: actions
          });
          break;
        case ColumnKinds.attachment:
          actions.openOverlay({
            head: <Header langtag={langtag} />,
            body: (
              <AttachmentOverlay
                cell={selectedCellObject}
                langtag={langtag}
                folderId={null}
                value={selectedCellDisplayValues}
              />
            ),
            type: "full-height",
            preferRight: true,
            title: selectedCellObject
          });
          break;
        case ColumnKinds.text:
        case ColumnKinds.richtext:
          actions.openOverlay({
            head: (
              <Header
                context={doto(
                  table,
                  tbl => getTableDisplayName(tbl, langtag),
                  unless(f.isString, f.toString)
                )}
                title={selectedCellDisplayValues[langtag]}
                langtag={langtag}
              />
            ),
            body: (
              <TextEditOverlay
                actions={actions}
                value={selectedCellDisplayValues}
                langtag={langtag}
                cell={selectedCellObject}
              />
            ),
            title: selectedCellObject,
            type: "full-height"
          });
          break;
      }
    }
  }
}

export function setNextSelectedCell(direction) {
  const { rows, columns } = this.props;
  const {
    selectedCell: { selectedCell }
  } = store.getState();
  const { columnId, rowId, langtag } = selectedCell;

  if (f.isNil(columnId) || f.isNil(rowId)) {
    return;
  }

  let rowCell = {
    id: rowId,
    selectedCellExpandedRow: langtag
  };

  let columnCell = {
    id: columnId,
    selectedCellExpandedRow: langtag
  };

  // Either row or column switch changes the selected language
  let newSelectedCellExpandedRow;

  switch (direction) {
    case Directions.LEFT:
      columnCell = getPreviousColumn.call(this);
      newSelectedCellExpandedRow = columnCell.selectedCellExpandedRow;
      break;

    case Directions.RIGHT:
      columnCell = getNextColumnCell.call(this);
      newSelectedCellExpandedRow = columnCell.selectedCellExpandedRow;
      break;

    case Directions.UP:
      rowCell = getPreviousRow.call(this);
      newSelectedCellExpandedRow = rowCell.selectedCellExpandedRow;
      break;

    case Directions.DOWN:
      rowCell = getNextRowCell.call(this);
      newSelectedCellExpandedRow = rowCell.selectedCellExpandedRow;
      break;
  }

  const newRow = f.find(row => row.id === rowCell.id, rows);
  const newColumn = f.find(col => col.id === columnCell.id, columns);

  if (newRow && newColumn) {
    const nextCell = {
      rowId: rowCell.id,
      columnId: columnCell.id,
      langtag: newSelectedCellExpandedRow
    };

    var isValidCell = nextCell.rowId > 0 && nextCell.columnId >= 0;
    var isNewCell = !f.isEqual(nextCell, selectedCell);

    if (isValidCell && isNewCell) {
      toggleCellSelection.call(this, {
        cell: nextCell,
        langtag: newSelectedCellExpandedRow
      });
    }
    this.forceUpdate();
  }
}

// returns the next row and the next language cell when expanded
export function getNextRowCell(getPrev) {
  const { tableView, rows, columns, getSelectedCellExpandedRow } = this.props;
  const globalLangtag = this.props.langtag;
  const selectedCellExpandedRow = getSelectedCellExpandedRow();
  const { expandedRowIds } = tableView;
  const {
    selectedCell: { selectedCell }
  } = store.getState();
  const { rowId, columnId } = selectedCell;
  const columnIndex = f.findIndex(col => col.id === columnId, columns);
  const selectedColumn = columns[columnIndex];

  const indexCurrentRow = f.findIndex(
    row => row.id === selectedCell.rowId,
    rows
  );
  const numberOfRows = rows.length;
  let nextSelectedCellExpandedRow;
  let nextIndex = getPrev ? indexCurrentRow - 1 : indexCurrentRow + 1;
  let jumpToNextRow = false;

  // are there expanded rows and is current selection inside of expanded row block
  if (
    expandedRowIds &&
    expandedRowIds.length > 0 &&
    expandedRowIds.indexOf(rowId) > -1
  ) {
    // get next (lower / upper) language position
    let nextLangtagIndex =
      Langtags.indexOf(selectedCellExpandedRow) + (getPrev ? -1 : 1);
    // jump to new language inside expanded row - but just when cell is multilanguage
    if (
      nextLangtagIndex >= 0 &&
      nextLangtagIndex <= Langtags.length - 1 &&
      selectedColumn.multilanguage
    ) {
      // keep the row
      nextIndex = indexCurrentRow;
      // set new language
      nextSelectedCellExpandedRow = Langtags[nextLangtagIndex];
    } else {
      jumpToNextRow = true;
    }
  } else {
    jumpToNextRow = true;
  }

  // Get the next row id
  const nextRowIndex = Math.max(0, Math.min(nextIndex, numberOfRows - 1));
  const nextRowId = rows[nextRowIndex].id;
  if (jumpToNextRow) {
    // Next row is expanded
    if (expandedRowIds && expandedRowIds.indexOf(nextRowId) > -1) {
      // Multilanguage cell
      if (selectedColumn.multilanguage) {
        nextSelectedCellExpandedRow = getPrev
          ? Langtags[Langtags.length - 1]
          : DefaultLangtag;
      } else {
        nextSelectedCellExpandedRow = DefaultLangtag;
      }
    } else {
      nextSelectedCellExpandedRow = globalLangtag;
    }
  }

  return {
    id: nextRowId,
    selectedCellExpandedRow: nextSelectedCellExpandedRow
  };
}

export function getPreviousRow() {
  return getNextRowCell.call(this, true);
}

export function getNextColumnCell(getPrev) {
  const {
    columns,
    tableView,
    getSelectedCellExpandedRow,
    visibleColumnOrdering
  } = this.props;
  const { expandedRowIds } = tableView;
  const {
    selectedCell: { selectedCell }
  } = store.getState();

  const getNextColumn = (visibleColumnOrdering, columns) => {
    const clampToVisibleRange = range => index => f.clamp(0, index, range);
    const orderedVisibleColumns = f.map(
      columnId => f.find(col => col.id === columnId, columns),
      visibleColumnOrdering
    );
    return f.compose(
      nextIndex => orderedVisibleColumns[nextIndex],
      clampToVisibleRange(orderedVisibleColumns.length - 1),
      f.add(getPrev ? -1 : 1),
      f.findIndex(f.propEq("id", selectedCell.columnId))
    )(orderedVisibleColumns);
  };

  const currentSelectedRowId = selectedCell.rowId;
  const nextColumn = getNextColumn(visibleColumnOrdering, columns);

  const newSelectedCellExpandedRow =
    !nextColumn.multilanguage &&
    expandedRowIds &&
    expandedRowIds.indexOf(currentSelectedRowId) > -1
      ? DefaultLangtag
      : getSelectedCellExpandedRow() || DefaultLangtag;

  return {
    id: f.get("id", nextColumn),
    selectedCellExpandedRow: newSelectedCellExpandedRow
  };
}

export function getPreviousColumn() {
  return getNextColumnCell.call(this, true);
}

/**
 * Helper to prevent massive events on pressing navigation keys for changing cell selections
 * @param cb
 */
export function preventSleepingOnTheKeyboard(cb) {
  if (this.keyboardRecentlyUsedTimer === null) {
    this.keyboardRecentlyUsedTimer = setTimeout(() => {
      this.keyboardRecentlyUsedTimer = null;
    }, 10);
    cb();
  }
}

function copySelectedCell() {
  const { actions, rows, visibleColumnOrdering } = this.props;
  const {
    selectedCell: {
      selectedCell: { rowId, columnId, langtag }
    }
  } = store.getState();

  const rowIndex = f.findIndex(row => row.id === rowId, rows);
  const columnIndex = f.findIndex(id => id === columnId, visibleColumnOrdering);

  const cell = this.getCell(rowIndex, columnIndex);

  actions.copyCellValue({
    cell,
    langtag
  });
}

function pasteSelectedCell() {
  const {
    rows,
    tableView: { copySource },
    visibleColumnOrdering
  } = this.props;
  const {
    selectedCell: {
      selectedCell: { rowId, columnId, langtag }
    }
  } = store.getState();

  const rowIndex = f.findIndex(row => row.id === rowId, rows);
  const columnIndex = f.findIndex(id => id === columnId, visibleColumnOrdering);

  const selectedCellObject = this.getCell(rowIndex, columnIndex);

  pasteCellValue(
    copySource.cell,
    copySource.langtag,
    selectedCellObject,
    langtag
  );
}

function createAndSelectNewRow() {
  const {
    actions,
    tableView: { currentTable }
  } = this.props;

  actions.addEmptyRow(currentTable);
  toggleCellEditing.call(this, { editing: false });

  this.setState({
    ...this.state,
    newRowAdded: true
  });
}
