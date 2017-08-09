import * as _ from "lodash";
import * as f from "lodash/fp";
import {ColumnKinds, DefaultLangtag, Directions, Langtags} from "../../constants/TableauxConstants";
import App from "ampersand-app";
import ActionCreator from "../../actions/ActionCreator";
import {isLocked, unlockRow} from "../../helpers/annotationHelper";
import askForSessionUnlock from "../helperComponents/SessionUnlockDialog";
import {getUserLanguageAccess, isUserAdmin} from "../../helpers/accessManagementHelper";
import {maybe} from "../../helpers/functools";

export function shouldCellFocus() {
  // we dont want to force cell focus when overlay is open
  return this.state.shouldCellFocus && !this.props.overlayOpen;
}

// Takes care that we never loose focus of the table to guarantee keyboard events are triggered
export function checkFocusInsideTable() {
  // Is a cell selected?
  if (this.state.selectedCell !== null) {
    let tableDOMNode = this.tableDOMNode;
    let focusedElement = document.activeElement;
    // happens in IE
    if (focusedElement === null) {
      maybe(tableDOMNode).method("focus");
    } else if (tableDOMNode && !tableDOMNode.contains(focusedElement)) {
      // Is the focus outside the table or is body selected
      // force table to be focused to get keyboard events
      tableDOMNode.focus();
    }
  }
}

export function disableShouldCellFocus() {
  if (this.state.shouldCellFocus) {
    window.devLog("Table.disableShouldCellFocus");
    this.setState({shouldCellFocus: false});
  }
}

export function enableShouldCellFocus() {
  if (!this.state.shouldCellFocus) {
    window.devLog("Table.enableShouldCellFocus");
    this.setState({shouldCellFocus: true});
  }
}

export function getKeyboardShortcuts() {
  const {selectedCell, selectedCellEditing} = this.state;

  // Force the next selected cell to be focused
  if (!shouldCellFocus.call(this)) {
    enableShouldCellFocus.call(this);
  }
  return {
    left: (event) => {
      event.preventDefault();
      preventSleepingOnTheKeyboard.call(this,
        () => {
          setNextSelectedCell.call(this, Directions.LEFT);
        }
      );
    },
    right: (event) => {
      event.preventDefault();
      preventSleepingOnTheKeyboard.call(this,
        () => {
          setNextSelectedCell.call(this, Directions.RIGHT);
        }
      );
    },
    tab: (event) => {
      event.preventDefault();
      preventSleepingOnTheKeyboard.call(this,
        () => {
          setNextSelectedCell.call(this, (event.shiftKey) ? Directions.LEFT : Directions.RIGHT);
        }
      );
    },
    up: (event) => {
      event.preventDefault();
      preventSleepingOnTheKeyboard.call(this,
        () => {
          setNextSelectedCell.call(this, Directions.UP);
        }
      );
    },
    down: (event) => {
      event.preventDefault();
      preventSleepingOnTheKeyboard.call(this,
        () => {
          setNextSelectedCell.call(this, Directions.DOWN);
        }
      );
    },
    enter: (event) => {
      event.preventDefault();
      preventSleepingOnTheKeyboard.call(this,
        () => {
          if (selectedCell && !selectedCellEditing) {
            toggleCellEditing.call(this,
              {
                langtag: this.state.selectedCellExpandedRow || this.props.langtag,
                event
              });
          }
        }
      );
    },
    escape: (event) => {
      event.preventDefault();
      preventSleepingOnTheKeyboard.call(this,
        () => {
          if (selectedCell && selectedCellEditing) {
            toggleCellEditing.call(this,
              {
                editing: false,
                event
              });
          }
        }
      );
    },
    text: (event) => {
      if (!selectedCell) {
        return;
      }
      const actionKey = (f.contains("Mac OS", navigator.userAgent))
        ? "metaKey"
        : "ctrlKey";
      const systemPaste = selectedCellEditing
      && f.contains(selectedCell.kind,
        [ColumnKinds.text, ColumnKinds.richtext, ColumnKinds.shorttext, ColumnKinds.numeric]);
      const langtag = this.state.selectedCellExpandedRow || this.props.langtag;
      if (f.prop(actionKey, event) && event.key === "c"  // Cell copy
        && selectedCell.kind !== ColumnKinds.concat) {
        event.stopPropagation();
        ActionCreator.copyCellContent(selectedCell, langtag);
      } else if (!_.isEmpty(this.props.pasteOriginCell)
        && !_.eq(this.props.pasteOriginCell, selectedCell)
        && f.prop(actionKey, event) && event.key === "v"
        && !systemPaste) {  // Cell paste
        event.preventDefault();
        event.stopPropagation();
        ActionCreator.pasteCellContent(selectedCell, langtag);
      } else if (!selectedCellEditing  // Other keypress
        && (!event.altKey && !event.metaKey && !event.ctrlKey)
        && (selectedCell.kind === ColumnKinds.text
        || selectedCell.kind === ColumnKinds.shorttext
        || selectedCell.kind === ColumnKinds.richtext
        || selectedCell.kind === ColumnKinds.numeric)) {
        toggleCellEditing.call(this, {event});
      }
    }
  };
}

/**
 * Checks if selected cell is overflowing and adjusts the scroll position
 * This enhances the default browser behaviour because it checks if the selected cell is completely visible.
 */
export function updateScrollViewToSelectedCell() {
  // Scrolling container
  let tableRowsDom = this.tableRowsDom;
  // Are there any selected cells?
  const cellsDom = tableRowsDom.getElementsByClassName("cell selected");
  if (cellsDom.length > 0) {
    // Get the first selected cell
    const cell = cellsDom[0];
    // Cell DOM position and dimensions
    const targetY = cell.offsetTop;
    const targetX = cell.offsetLeft;
    const cellWidth = cell.offsetWidth;
    const cellHeight = cell.offsetHeight;
    // Scroll container position and dimensions
    const currentScrollPositionX = tableRowsDom.scrollLeft;
    const currentScrollPositionY = tableRowsDom.scrollTop;
    const containerWidth = tableRowsDom.clientWidth;
    const containerHeight = tableRowsDom.clientHeight;

    // Check if cell is outside the view. Cell has to be completely visible
    if (targetX < currentScrollPositionX) {
      // Overflow Left
      tableRowsDom.scrollLeft = targetX;
    } else if (targetX + cellWidth > currentScrollPositionX + containerWidth) {
      // Overflow Right
      tableRowsDom.scrollLeft = targetX - (containerWidth - cellWidth);
    }

    if (targetY < currentScrollPositionY) {
      // Overflow Top
      tableRowsDom.scrollTop = targetY;
    } else if (targetY + cellHeight > currentScrollPositionY + containerHeight) {
      // Overflow Bottom
      tableRowsDom.scrollTop = targetY - (containerHeight - cellHeight);
    }
  }
}

export function isLastRowSelected() {
  const rows = this.props.rows;
  const numberOfRows = rows.length;
  const currentRowId = getCurrentSelectedRowId.call(this);
  let lastRowId;
  if (numberOfRows <= 0) {
    return true;
  }
  lastRowId = rows.at(numberOfRows - 1).getId();
  return (currentRowId === lastRowId);
}

export function toggleCellSelection({selected, cell, langtag}) {
  const tableId = cell.tableId;
  const columnId = cell.column.id;
  const rowId = cell.row.id;
  if (selected !== "NO_HISTORY_PUSH") {
    const cellURL = `/${this.props.langtag}/tables/${tableId}/columns/${columnId}/rows/${rowId}`;
    App.router.navigate(cellURL, {trigger: false});
  }
  if (!f.isNil(this.state.selectedCell) && !f.equals(this.state.selectedCell.row, cell.row)) {
    unlockRow(this.state.selectedCell.row, false);
  }
  this.setState({
    selectedCell: cell,
    selectedCellEditing: false,
    selectedCellExpandedRow: langtag || null
  });
}

export function toggleCellEditing(params = {}) {
  const canEdit = f.contains(params.langtag, getUserLanguageAccess()) || isUserAdmin();
  const editVal = (!_.isUndefined(params) && !_.isUndefined(params.editing)) ? params.editing : true;
  const selectedCell = this.state.selectedCell;
  const needsTranslation = f.contains(
    params.langtag,
    f.intersection(getUserLanguageAccess(), f.prop(["annotations", "translationNeeded", "langtags"], selectedCell))
  );
  if (selectedCell && canEdit) {
    const noEditingModeNeeded = (f.contains(selectedCell.kind, [ColumnKinds.boolean, ColumnKinds.link, ColumnKinds.attachment]));
    if ((!this.state.selectedCellEditing || !noEditingModeNeeded) // Editing requested or unnecessary
      && isLocked(selectedCell.row) && !needsTranslation) {       // needs_translation overrules final
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
  if (!this.state.selectedCell) {
    return;
  }

  let row;
  let nextCellId;
  let rowCell = {
    id: getCurrentSelectedRowId.call(this),
    selectedCellExpandedRow: this.props.langtag
  };
  let columnCell = {
    id: getCurrentSelectedColumnId.call(this),
    selectedCellExpandedRow: this.props.langtag
  };
  let newSelectedCellExpandedRow; // Either row or column switch changes the selected language
  const {table} = this.props;
  const currentSelectedColumnId = getCurrentSelectedColumnId.call(this);
  const currentSelectedRowId = getCurrentSelectedRowId.call(this);

  switch (direction) {
    case Directions.LEFT:
      columnCell = getPreviousColumn.call(this, currentSelectedColumnId);
      newSelectedCellExpandedRow = columnCell.selectedCellExpandedRow;
      break;

    case Directions.RIGHT:
      columnCell = getNextColumnCell.call(this, currentSelectedColumnId);
      newSelectedCellExpandedRow = columnCell.selectedCellExpandedRow;
      break;

    case Directions.UP:
      rowCell = getPreviousRow.call(this, currentSelectedRowId);
      newSelectedCellExpandedRow = rowCell.selectedCellExpandedRow;
      break;

    case Directions.DOWN:
      rowCell = getNextRowCell.call(this, currentSelectedRowId);
      newSelectedCellExpandedRow = rowCell.selectedCellExpandedRow;
      break;
  }

  row = table.rows.get(rowCell.id);
  nextCellId = "cell-" + table.getId() + "-" + columnCell.id + "-" + rowCell.id;
  if (row) {
    let nextCell = row.cells.get(nextCellId);
    if (nextCell) {
      toggleCellSelection.call(this, {
        cell: nextCell,
        langtag: newSelectedCellExpandedRow
      });
    }
  }
}

// returns the next row and the next language cell when expanded
export function getNextRowCell(currentRowId, getPrev) {
  const {expandedRowIds, selectedCell, selectedCellExpandedRow} = this.state;
  const {rows, langtag} = this.props;
  const currentRow = rows.get(currentRowId);
  const indexCurrentRow = rows.indexOf(currentRow);
  const numberOfRows = rows.length;
  let nextSelectedCellExpandedRow;
  let nextIndex = getPrev ? indexCurrentRow - 1 : indexCurrentRow + 1;
  let nextRowIndex;
  let nextRowId;
  let jumpToNextRow = false;

  // are there expanded rows and is current selection inside of expanded row block
  if (expandedRowIds && expandedRowIds.length > 0 && expandedRowIds.indexOf(currentRowId) > -1) {
    // get next (lower / upper) language position
    let nextLangtagIndex = Langtags.indexOf(selectedCellExpandedRow) + (getPrev ? -1 : 1);
    // jump to new language inside expanded row - but just when cell is multilanguage
    if (nextLangtagIndex >= 0 && nextLangtagIndex <= Langtags.length - 1 && selectedCell.isMultiLanguage) {
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
  nextRowIndex = Math.max(0, Math.min(nextIndex, numberOfRows - 1));
  nextRowId = rows.at(nextRowIndex).getId();

  if (jumpToNextRow) {
    // Next row is expanded
    if (expandedRowIds && expandedRowIds.indexOf(nextRowId) > -1) {
      // Multilanguage cell
      if (selectedCell.isMultiLanguage) {
        nextSelectedCellExpandedRow = getPrev ? Langtags[Langtags.length - 1] : DefaultLangtag;
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

export function getPreviousRow(currentRowId) {
  return getNextRowCell.call(this, currentRowId, true);
}

export function getNextColumnCell(currentColumnId, getPrev) {
  const columns = this.props.table.columns.filter(col => col.visible);
  const {selectedCell, expandedRowIds, selectedCellExpandedRow} = this.state;
  const indexCurrentColumn = f.findIndex(f.matchesProperty("id", currentColumnId), columns);
  const numberOfColumns = columns.length;
  const nextIndex = getPrev ? indexCurrentColumn - 1 : indexCurrentColumn + 1;
  const nextColumnIndex = f.clamp(0, nextIndex, numberOfColumns - 1);
  const nextColumn = f.nth(nextColumnIndex, columns);
  const nextColumnId = nextColumn.id;
  const currentSelectedRowId = selectedCell.rowId;
  let newSelectedCellExpandedRow;

  // Not Multilanguage and row is expanded so jump to top language
  if (!nextColumn.multilanguage && expandedRowIds && expandedRowIds.indexOf(currentSelectedRowId) > -1) {
    newSelectedCellExpandedRow = DefaultLangtag;
  } else {
    newSelectedCellExpandedRow = selectedCellExpandedRow;
  }

  return {
    id: nextColumnId,
    selectedCellExpandedRow: newSelectedCellExpandedRow
  };
}

export function getPreviousColumn(currentColumnId) {
  return getNextColumnCell.call(this, currentColumnId, true);
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

export function getCurrentSelectedRowId() {
  const {selectedCell} = this.state;
  return selectedCell ? selectedCell.rowId : 0;
}

export function getCurrentSelectedColumnId() {
  const {selectedCell} = this.state;
  return selectedCell ? selectedCell.column.getId() : 0;
}

export function scrollToLeftStart(e) {
  scrollToLeftLinear(this.tableRowsDom, 250);
}

/** Helper function to scroll to the left.
 * TODO: Improve with ease out function. Great article about it:
 * https://www.kirupa.com/html5/animating_with_easing_functions_in_javascript.htm *
 * **/

function scrollToLeftLinear(element, scrollDuration) {
  const scrollStep = element.scrollLeft / (scrollDuration / 15);
  if (requestAnimationFrame !== "undefined") {
    const step = () => {
      if (element.scrollLeft > 0) {
        requestAnimationFrame(step);
        element.scrollLeft -= scrollStep;
      }
    };
    requestAnimationFrame(step);
  } else {
    element.scrollLeft = 0;
  }
}
