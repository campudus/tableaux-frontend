import React from "react";
import ReactDOM from "react-dom";
import ActionCreator from "../../actions/ActionCreator";
import {ColumnKinds, FallBackLanguage, Langtags} from "../../constants/TableauxConstants";
import TextCell from "./text/TextCell.jsx";
import ShortTextCell from "./text/ShortTextCell.jsx";
import NumericCell from "./numeric/NumericCell.jsx";
import LinkCell from "./link/LinkCell.jsx";
import AttachmentCell from "./attachment/AttachmentCell.jsx";
import BooleanCell from "./boolean/BooleanCell.jsx";
import DateTimeCell from "./datetime/DateTimeCell.jsx";
import IdentifierCell from "./identifier/IdentifierCell.jsx";
import RowConcatHelper from "../../helpers/RowConcatHelper";
import DisabledCell from "./disabled/DisabledCell.jsx";
import KeyboardShortcutsHelper from "../../helpers/KeyboardShortcutsHelper";
import CurrencyCell from "./currency/CurrencyCell.jsx";
import DateCell from "./date/DateCell";
import connectToAmpersand from "../helperComponents/connectToAmpersand";
import classNames from "classnames";
import * as f from "lodash/fp";
import {addTranslationNeeded, deleteCellAnnotation, removeTranslationNeeded} from "../../helpers/annotationHelper";
import openTranslationDialog from "../overlay/TranslationDialog";
import {either} from "../../helpers/monads";

// used to measure when the the cell hint is shown below the selected cell (useful when selecting the very first
// visible row)
const CELL_HINT_PADDING = 40;

export const contentChanged = (cell, langtag, oldValue) => () => {
  if (!cell.isMultiLanguage || either(cell)
      .map(f.prop(["value", langtag]))
      .orElse(f.prop("value")).value === oldValue) {
    return;
  }
  const isPrimaryLanguage = langtag === f.first(Langtags);
  const untranslated = f.compose(
    f.filter(lt => f.isEmpty(f.prop(["value", lt], cell))),
    f.drop(1)
  )(Langtags);
  const translationAnnotation = f.prop(["annotations", "translationNeeded"], cell);
  const translationsExist = untranslated.length !== Langtags.length - 1;

  if (isPrimaryLanguage) {
    const flagAllTranslations = () => addTranslationNeeded(f.drop(1, Langtags), cell);
    const flagEmptyTranslations = () => (!f.isEmpty(untranslated))
      ? addTranslationNeeded(untranslated, cell)
      : () => {
      };
    if (translationsExist) {
      const column = cell.column;
      const columnName = f.prop(["displayName", langtag], column)
        || f.prop(["displayName", FallBackLanguage], column)
        || f.prop(["displayName"], column);
      openTranslationDialog(columnName, flagAllTranslations, flagEmptyTranslations);
    } else {
      flagEmptyTranslations();
    }
  } else {
    const remainingTranslations = f.remove(f.equals(langtag), f.prop("langtags", translationAnnotation));
    if (f.contains(langtag, f.prop("langtags", translationAnnotation))) {
      removeTranslationNeeded(langtag, cell);
      if (f.isEmpty(remainingTranslations)) {
        deleteCellAnnotation(translationAnnotation, cell);
      }
    }
  }
};

@connectToAmpersand
class Cell extends React.Component {

  cellDOMNode = null;

  constructor(props) {
    super(props);
    this.keyboardShortcuts = {};
    this.props.watch(this.props.cell,
      {
        event: "change:value",
        force: true
      });
  };

  componentDidMount = () => {
    this.cellDOMNode = ReactDOM.findDOMNode(this);
    this.cellOffset = this.cellDOMNode.offsetTop;
    this.checkFocus();
  };

  componentDidUpdate = () => {
    this.checkFocus();
  };

  // Dont update when cell is not editing or selected
  shouldComponentUpdate = (nextProps, nextState) => {
    const {selected, editing, langtag, shouldFocus} = this.props;
    return (editing !== nextProps.editing
    || selected !== nextProps.selected
    || langtag !== nextProps.langtag
    || shouldFocus !== nextProps.shouldFocus);
  };

  getKeyboardShortcuts = (event) => {
    return this.keyboardShortcuts;
  };

  setKeyboardShortcutsForChildren = (childrenEvents) => {
    this.keyboardShortcuts = childrenEvents;
  };

  checkFocus = () => {
    if (this.props.selected && !this.props.editing && this.props.shouldFocus) {
      const cellDOMNode = this.cellDOMNode;
      const focusedElement = document.activeElement;
      // Is current focus this cell or inside of cell don't change the focus. This way child components can force their
      // focus. (e.g. Links Component)
      if (!focusedElement || !cellDOMNode.contains(focusedElement) || focusedElement.isEqualNode(cellDOMNode)) {
        cellDOMNode.focus();
      }
    }
  };

  cellClickedWorker = (event, withRightClick) => {
    let {cell, editing, selected, langtag, shouldFocus} = this.props;
    console.log("cell clicked: ", cell, "value: ", cell.value, cell.displayValue);

    // we select the cell when clicking or right clicking. Don't jump in edit mode when selected and clicking right
    if (!selected) {
      ActionCreator.toggleCellSelection(cell, selected, langtag);
    } else if (!withRightClick) {
      ActionCreator.toggleCellEditing({langtag});
    }

    if (withRightClick) {
      event.preventDefault();
      ActionCreator.showRowContextMenu(this.props.row, langtag, event.pageX, event.pageY, this.props.table, cell);
    }

    if (!withRightClick || editing) {
      /*
       Important to block the click listener of Table. This helps focusing the cell when clicked but prevents from scrolling
       the table view when clicking on an element other than the cell.
       */
      event.stopPropagation();
    }
    if (!shouldFocus) {
      ActionCreator.enableShouldCellFocus();
    }
  };

  rightClicked = (event) => {
    this.cellClickedWorker(event, true);
  };

  cellClicked = (event) => {
    this.cellClickedWorker(event);
  };

  onMouseDownHandler = (e) => {
    // Prevents table mousedown handler, so we can select
    e.stopPropagation();
  };

  render = () => {
    const {cell, langtag, selected, editing} = this.props;
    const {link, attachment, numeric, group, boolean, date, datetime, shorttext, concat, currency, text, richtext} = ColumnKinds;
    // const selectable = [link, attachment, boolean, concat, currency, text];
    const noKeyboard = [concat, "disabled", text, richtext];

    const cellKinds = {
      [link]: LinkCell,
      [attachment]: AttachmentCell,
      [numeric]: NumericCell,
      [boolean]: BooleanCell,
      [date]: DateCell,
      [datetime]: DateTimeCell,
      [shorttext]: ShortTextCell,
      [concat]: IdentifierCell,
      [currency]: CurrencyCell,
      [text]: TextCell,
      [richtext]: TextCell,
      [group]: IdentifierCell
    };

    const kind = cell.isEditable ? this.props.cell.kind : "disabled";
    const {translationNeeded} = cell.annotations;
    const isPrimaryLanguage = langtag === f.first(Langtags);
    const cellNeedsTranslation = translationNeeded && f.contains(langtag,
        translationNeeded.langtags) && !isPrimaryLanguage;
    const needsTranslationOtherLanguages = !f.isEmpty(f.prop("langtags", translationNeeded)) && isPrimaryLanguage;
    const cssClass = classNames(`cell cell-${kind} cell-${cell.column.getId()}-${cell.rowId}`,
      {
        "selected": selected,
        "editing": cell.isEditable && editing,
        "needs-translation": cellNeedsTranslation
      }
    );

    const CellKind = (kind === "disabled")
      ? DisabledCell
      : (cellKinds[kind] || TextCell);

    const cellItem = (
      <CellKind cell={cell} langtag={langtag}
                selected={selected}
                editing={cell.isEditable && editing}
                contentChanged={contentChanged(cell, langtag)}
                setCellKeyboardShortcuts={(f.contains(kind, noKeyboard)) ? function () {
                } : this.setKeyboardShortcutsForChildren}
      />
    );

    const expandCorner = (needsTranslationOtherLanguages)
      ? <div className="needs-translation-other-language"
             onClick={
               evt => {
                 evt.stopPropagation();
                 ActionCreator.toggleRowExpand(cell.row.getId());
               }
             }
      />
      : null;

    // onKeyDown event just for selected components
    if (selected) {
      const firstCell = cell.collection.at(0);
      const indexOfCell = cell.collection.indexOf(cell);
      const rowDisplayLabel = RowConcatHelper.getCellAsStringWithFallback(firstCell.value, firstCell.column, langtag);
      // get global so not every single cell needs to look fo the table rows dom element
      const tableRowsDom = window.GLOBAL_TABLEAUX.tableRowsDom;
      const difference = this.cellOffset - tableRowsDom.scrollTop;
      const rowDisplayLabelClass = classNames(
        "row-display-label",
        {"flip": -CELL_HINT_PADDING < difference && difference < CELL_HINT_PADDING}
      );

      // We just show the info starting at the fourth column
      const rowDisplayLabelElement = indexOfCell >= 3 ? (
        <div className={rowDisplayLabelClass}><span className="content">{langtag} | {rowDisplayLabel}</span>
        </div>) : null;

      return (
        <div className={cssClass} onClick={this.cellClicked} onContextMenu={this.rightClicked}
             tabIndex="-1" onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
             onMouseDown={this.onMouseDownHandler}>
          {cellItem}
          {expandCorner}
          {rowDisplayLabelElement}
        </div>
      );
    } else {
      return (
        <div className={cssClass} onClick={this.cellClicked} onContextMenu={this.rightClicked}
             tabIndex="-1">
          {cellItem}
          {expandCorner}
        </div>
      );
    }
  }
}

Cell.propTypes = {
  cell: React.PropTypes.object.isRequired,
  langtag: React.PropTypes.string.isRequired,
  selected: React.PropTypes.bool,
  editing: React.PropTypes.bool,
  row: React.PropTypes.object.isRequired,
  table: React.PropTypes.object.isRequired,
  shouldFocus: React.PropTypes.bool,
  showTranslationStatus: React.PropTypes.bool
};

export default Cell;
