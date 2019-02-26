import f from "lodash/fp";
import {
  ColumnKinds,
  DefaultLangtag,
  Directions,
  Langtags
} from "../../constants/TableauxConstants";
import TableauxRouter from "../../router/router";
import { isLocked, unlockRow } from "../../helpers/annotationHelper";
import askForSessionUnlock from "../helperComponents/SessionUnlockDialog";
import {
  getUserLanguageAccess,
  isUserAdmin
} from "../../helpers/accessManagementHelper";
import { maybe } from "../../helpers/functools";
import * as TableHistory from "./undo/tableHistory";
import { KEYBOARD_TABLE_HISTORY } from "../../FeatureFlags";

// Takes care that we never loose focus of the table to guarantee keyboard events are triggered
export function checkFocusInsideTable() {
  // Is a cell selected?
  if (this.state.selectedCell !== null) {
    const tableDOMNode = document.getElementById("table-wrapper");
    let focusedElement = document.activeElement;
    // happens in IE
    if (focusedElement === null) {
      maybe(tableDOMNode).method("focus");
    } else if (
      maybe(tableDOMNode)
        .exec("contains", focusedElement)
        .map(boolVal => !boolVal)
        .getOrElse(false)
    ) {
      // Is the focus outside the table or is body selected
      // force table to be focused to get keyboard events
      tableDOMNode.focus();
    }
  }
}

export function getKeyboardShortcuts() {
  const { selectedCell, selectedCellEditing } = this.state;
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
            langtag: this.state.selectedCellExpandedRow || this.props.langtag,
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
      const thisLangtag = this.props.langtag;
      const systemPaste =
        selectedCellEditing &&
        f.contains(selectedCell.kind, [
          ColumnKinds.text,
          ColumnKinds.richtext,
          ColumnKinds.shorttext,
          ColumnKinds.numeric
        ]);
      // const langtag = this.state.selectedCellExpandedRow || thisLangtag;

      if (
        hasActionKey &&
        isKeyPressed("c") && // Cell copy
        selectedCell.kind !== ColumnKinds.concat &&
        !isTextSelected()
      ) {
        event.stopPropagation();
        // TODO-W
        // ActionCreator.copyCellContent(selectedCell, langtag);
      } else if (
        !f.isEmpty(this.props.pasteOriginCell) &&
        !f.eq(this.props.pasteOriginCell, selectedCell) &&
        hasActionKey &&
        isKeyPressed("v") &&
        !systemPaste
      ) {
        // Cell paste
        event.preventDefault();
        event.stopPropagation();
        // TODO-W
        // ActionCreator.pasteCellContent(selectedCell, langtag);
      } else if (
        KEYBOARD_TABLE_HISTORY &&
        hasActionKey &&
        (isKeyPressed("z") || isKeyPressed("Z"))
      ) {
        // note upper/lower case!
        if (!selectedCellEditing) {
          const undoFn = isKeyPressed("Z")
            ? TableHistory.redo
            : TableHistory.undo;
          undoFn();
        }
      } else if (
        KEYBOARD_TABLE_HISTORY &&
        isKeyPressed("y") &&
        event.ctrlKey &&
        !selectedCellEditing
      ) {
        TableHistory.redo();
      } else if (
        !selectedCellEditing && // Other keypress
        (!event.altKey && !event.metaKey && !event.ctrlKey) &&
        (selectedCell.kind === ColumnKinds.text ||
          selectedCell.kind === ColumnKinds.shorttext ||
          selectedCell.kind === ColumnKinds.richtext ||
          selectedCell.kind === ColumnKinds.numeric)
      ) {
        toggleCellEditing.call(this, { event });
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

export function toggleCellSelection({ selected, cell, langtag }) {
  const tableId = this.props.tableView.currentTable;
  const columnId = cell.columnId;
  const rowId = cell.rowId;

  TableauxRouter.selectCellHandler(tableId, rowId, columnId, langtag);

  this.props.actions.toggleCellSelection({
    columnId,
    rowId,
    langtag,
    tableId
  });

  this.setState({
    selectedCell: cell,
    selectedCellEditing: false,
    selectedCellExpandedRow: langtag || null
  });

  /*
  if (selected !== "NO_HISTORY_PUSH") {
    const cellURL = `/${
      this.props.langtag
    }/tables/${tableId}/columns/${columnId}/rows/${rowId}`;
    App.router.navigate(cellURL, { trigger: false });
  }
  if (
    !f.isNil(this.state.selectedCell) &&
    !f.equals(this.state.selectedCell.row, cell.row)
  ) {
    unlockRow(this.state.selectedCell.row, false);
  }
  */
}

export function toggleCellEditing(params = {}) {
  const canEdit =
    f.contains(params.langtag, getUserLanguageAccess()) || isUserAdmin();
  const editVal = f.isBoolean(params.editing) ? params.editing : true;
  const selectedCell = this.state.selectedCell;
  const needsTranslation = f.contains(
    params.langtag,
    f.intersection(
      getUserLanguageAccess(),
      f.prop(["annotations", "translationNeeded", "langtags"], selectedCell)
    )
  );
  if (selectedCell && canEdit) {
    const noEditingModeNeeded = f.contains(selectedCell.kind, [
      ColumnKinds.boolean,
      ColumnKinds.link,
      ColumnKinds.attachment
    ]);
    if (
      (!this.state.selectedCellEditing || !noEditingModeNeeded) && // Editing requested or unnecessary
      isLocked(selectedCell.row) &&
      !needsTranslation
    ) {
      // needs_translation overrules final
      askForSessionUnlock(selectedCell.row, f.prop(["event", "key"], params));
      return;
    }
    if (!noEditingModeNeeded) {
      this.setState({
        selectedCellEditing: editVal
      });
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

  let newSelectedCellExpandedRow; // Either row or column switch changes the selected language

  switch (direction) {
    case Directions.LEFT:
      columnCell = getPreviousColumn.call(this, columnId);
      newSelectedCellExpandedRow = columnCell.selectedCellExpandedRow;
      break;

    case Directions.RIGHT:
      columnCell = getNextColumnCell.call(this, rowId);
      newSelectedCellExpandedRow = columnCell.selectedCellExpandedRow;
      break;

    case Directions.UP:
      rowCell = getPreviousRow.call(this, rowId);
      newSelectedCellExpandedRow = rowCell.selectedCellExpandedRow;
      break;

    case Directions.DOWN:
      rowCell = getNextRowCell.call(this, columnId);
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
export function getNextRowCell(currentRowId2, getPrev) {
  const { expandedRowIds, selectedCellExpandedRow } = this.state;
  const { tableView, langtag, rows } = this.props;
  const { selectedCell } = tableView;
  const { rowId } = selectedCell;

  const currentRowId = rowId;

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
    expandedRowIds.indexOf(currentRowId) > -1
  ) {
    // get next (lower / upper) language position
    let nextLangtagIndex =
      Langtags.indexOf(selectedCellExpandedRow) + (getPrev ? -1 : 1);
    // jump to new language inside expanded row - but just when cell is multilanguage
    if (
      nextLangtagIndex >= 0 &&
      nextLangtagIndex <= Langtags.length - 1 // &&
      // selectedCell.isMultiLanguage
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
      //if (selectedCell.isMultiLanguage) {
      nextSelectedCellExpandedRow = getPrev
        ? Langtags[Langtags.length - 1]
        : DefaultLangtag;
      /*} else {
        nextSelectedCellExpandedRow = DefaultLangtag;
      }*/
    } else {
      nextSelectedCellExpandedRow = langtag;
    }
  }

  return {
    id: nextRowId,
    selectedCellExpandedRow: nextSelectedCellExpandedRow
  };
}

export function getPreviousRow(currentRowId) {
  return getNextRowCell.call(this, currentRowId, true);
}

export function getNextColumnCell(currentColumnId, getPrev) {
  const { columns, tableView } = this.props;
  const { selectedCell } = tableView;
  const { expandedRowIds, selectedCellExpandedRow } = this.state;
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

export function getPreviousColumn(currentColumnId) {
  return getNextColumnCell.call(this, currentColumnId, true);
}

/**
 * Helper to prevent massive events on pressing navigation keys for changing cell selections
 * @param cb
 */
// TODO-W
// we could let it be a bit faster because of rewrite-performance!
export function preventSleepingOnTheKeyboard(cb) {
  if (this.keyboardRecentlyUsedTimer === null) {
    this.keyboardRecentlyUsedTimer = setTimeout(() => {
      this.keyboardRecentlyUsedTimer = null;
    }, 100);
    cb();
  }
}

/*export function getCurrentSelectedRowId() {
  const { selectedCell } = this.state;
  return selectedCell ? selectedCell.rowId : 0;
}

export function getCurrentSelectedColumnId() {
  const { selectedCell } = this.state;
  return selectedCell ? selectedCell.column.getId() : 0;
}*/
