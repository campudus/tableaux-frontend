import React from "react";
import f from "lodash/fp";
import {
  ColumnKinds,
  DefaultLangtag,
  Directions,
  Langtags,
  FallbackLanguage
} from "../../constants/TableauxConstants";
import TableauxRouter from "../../router/router";
import { isLocked } from "../../helpers/annotationHelper";
import {
  getUserLanguageAccess,
  isUserAdmin
} from "../../helpers/accessManagementHelper";
import { maybe, doto } from "../../helpers/functools";
import { KEYBOARD_TABLE_HISTORY } from "../../FeatureFlags";
import Header from "../overlay/Header";
import TextEditOverlay from "../cells/text/TextEditOverlay";
import AttachmentOverlay from "../cells/attachment/AttachmentOverlay";
import { openLinkOverlay } from "../cells/link/LinkOverlay";
import pasteCellValue from "../cells/cellCopyHelper";

// Takes care that we never loose focus of the table to guarantee keyboard events are triggered
export function checkFocusInsideTable() {
  // Is a cell selected?
  if (!f.isEmpty(this.props.tableView.selectedCell)) {
    const tableDOMNode = document.getElementById("virtual-table-wrapper");

    if (tableDOMNode) {
      maybe(tableDOMNode).method("focus");
    }
  }
}

export function getKeyboardShortcuts() {
  const { actions, tableView } = this.props;
  const { selectedCell } = tableView;
  const selectedCellEditing = tableView.editing;
  const actionKey = f.contains("Mac OS", navigator.userAgent)
    ? "metaKey"
    : "ctrlKey";

  return {
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
          event.shiftKey ? Directions.LEFT : Directions.RIGHT
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
        if (selectedCell && !selectedCellEditing) {
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
      const hasActionKey = !!f.get(actionKey, event);
      const isKeyPressed = k =>
        k >= "A" && k <= "Z"
          ? f.matchesProperty("key", k)(event) ||
            (f.matchesProperty("key", f.toLower(k))(event) &&
              f.get("shiftKey", event))
          : f.matchesProperty("key", k)(event);

      const systemPaste =
        selectedCellEditing &&
        f.contains(selectedCell.kind, [
          ColumnKinds.text,
          ColumnKinds.richtext,
          ColumnKinds.shorttext,
          ColumnKinds.numeric
        ]);

      if (
        hasActionKey &&
        isKeyPressed("c") &&
        selectedCell.kind !== ColumnKinds.concat &&
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
        event.ctrlKey &&
        !selectedCellEditing
      ) {
        event.preventDefault();
        event.stopPropagation();
        actions.modifyHistory("redo", tableView.currentTable);
      } else if (
        !selectedCellEditing && // Other keypress
        (!event.altKey && !event.metaKey && !event.ctrlKey) &&
        (selectedCell.kind === ColumnKinds.text ||
          selectedCell.kind === ColumnKinds.shorttext ||
          selectedCell.kind === ColumnKinds.richtext ||
          selectedCell.kind === ColumnKinds.numeric)
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
  const { rows, tableView } = this.props;
  const currentRowId = tableView.selectedCell.rowId;
  const numberOfRows = f.size(rows);
  const currentRowIndex = f.findIndex(row => row.id === currentRowId, rows);

  return currentRowIndex === numberOfRows;
}

export function toggleCellSelection({ cell, langtag }) {
  const { actions, tableView, setSelectedCellExpandedRow } = this.props;
  const tableId = tableView.currentTable;
  const columnId = cell.columnId;
  const rowId = cell.rowId;
  const wasEditing = tableView.editing;

  TableauxRouter.selectCellHandler(tableId, rowId, columnId, langtag);

  actions.toggleCellSelection({
    columnId,
    rowId,
    langtag,
    tableId
  });

  setSelectedCellExpandedRow(langtag);

  // reset editing so navigation does not get stuck on a locked row
  if (wasEditing) {
    actions.toggleCellEditing({ editing: false });
  }
}

export function toggleCellEditing(params = {}) {
  const canEdit =
    f.contains(params.langtag, getUserLanguageAccess()) || isUserAdmin();
  const editVal = f.isBoolean(params.editing) ? params.editing : true;
  const { columns, rows, tableView, actions } = this.props;
  const {
    selectedCell: { columnId, rowId, langtag },
    currentTable
  } = tableView;

  const columnIndex = f.findIndex(col => col.id === columnId, columns);
  const rowIndex = f.findIndex(row => row.id === rowId, rows);

  const selectedColumn = columns[columnIndex];
  const selectedRow = rows[rowIndex];

  const selectedCellObject = this.getCell(rowIndex, columnIndex);
  const selectedCellValues = selectedCellObject.displayValue;
  const selectedCellKind = selectedCellObject.kind;
  const table = selectedCellObject.table;

  if (canEdit && selectedCellObject) {
    actions.toggleCellEditing({ editing: editVal, row: selectedRow });

    if (!isLocked(selectedRow)) {
      switch (selectedCellKind) {
        case ColumnKinds.boolean:
          actions.changeCellValue({
            tableId: currentTable,
            column: selectedColumn,
            columnId: columnId,
            rowId: rowId,
            oldValue: selectedCellValues,
            newValue: selectedCellObject.isMultiLanguage
              ? { [langtag]: !selectedCellValues }
              : !selectedCellValues,
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
                folderId={f.get([0, "folder"], selectedCellValues)}
                value={selectedCellValues}
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
                  [
                    table.displayName[langtag],
                    table.displayName[FallbackLanguage],
                    table.name
                  ],
                  f.compact,
                  f.first,
                  ctx => (f.isString(ctx) ? ctx : f.toString(ctx))
                )}
                title={selectedCellValues[langtag]}
                langtag={langtag}
              />
            ),
            body: (
              <TextEditOverlay
                actions={actions}
                value={selectedCellValues}
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
  const { tableView, rows, columns } = this.props;
  const { selectedCell } = tableView;
  const { columnId, rowId, langtag } = selectedCell;

  if (!columnId || !rowId) {
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

    var isValidCell = nextCell.rowId > 0 && nextCell.columnId > 0;
    var isNewCell =
      nextCell.columnId !== columnId ||
      nextCell.rowId !== rowId ||
      newSelectedCellExpandedRow !== langtag;

    if (isValidCell && isNewCell) {
      toggleCellSelection.call(this, {
        cell: nextCell,
        langtag: newSelectedCellExpandedRow
      });
    }
  }
}

// returns the next row and the next language cell when expanded
export function getNextRowCell(getPrev) {
  const { tableView, rows, columns, selectedCellExpandedRow } = this.props;
  const { selectedCell, expandedRowIds } = tableView;
  const { rowId, langtag, columnId } = selectedCell;
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
      nextSelectedCellExpandedRow = langtag;
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
  const { columns, tableView, selectedCellExpandedRow } = this.props;
  const { selectedCell, expandedRowIds } = tableView;
  const indexCurrentColumn = f.findIndex(
    f.matchesProperty("id", selectedCell.columnId),
    columns
  );
  const numberOfColumns = columns.length;
  const nextIndex = getPrev ? indexCurrentColumn - 1 : indexCurrentColumn + 1;
  const nextColumnIndex = f.clamp(0, nextIndex, numberOfColumns - 1);

  const nextColumn = f.nth(nextColumnIndex, columns);
  const nextColumnId = nextColumn.id;
  const currentSelectedRowId = selectedCell.rowId;
  let newSelectedCellExpandedRow;

  // Not Multilanguage and row is expanded so jump to top language
  if (
    !nextColumn.multilanguage &&
    expandedRowIds &&
    expandedRowIds.indexOf(currentSelectedRowId) > -1
  ) {
    newSelectedCellExpandedRow = DefaultLangtag;
  } else {
    newSelectedCellExpandedRow = selectedCellExpandedRow;
  }

  const result = {
    id: nextColumnId,
    selectedCellExpandedRow: newSelectedCellExpandedRow
  };

  return result;
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
    }, 100);
    cb();
  }
}

function copySelectedCell() {
  const {
    actions,
    rows,
    columns,
    tableView: {
      selectedCell: { columnId, rowId, langtag }
    }
  } = this.props;

  const rowIndex = f.findIndex(row => row.id === rowId, rows);
  const columnIndex = f.findIndex(col => col.id === columnId, columns);

  const cell = this.getCell(rowIndex, columnIndex);

  actions.copyCellValue({
    cell,
    langtag
  });
}

function pasteSelectedCell() {
  const {
    rows,
    columns,
    tableView: {
      selectedCell: { columnId, rowId, langtag },
      copySource
    }
  } = this.props;

  const rowIndex = f.findIndex(row => row.id === rowId, rows);
  const columnIndex = f.findIndex(col => col.id === columnId, columns);

  const selectedCellObject = this.getCell(rowIndex, columnIndex);

  pasteCellValue(
    copySource.cell,
    copySource.langtag,
    selectedCellObject,
    langtag
  );
}
