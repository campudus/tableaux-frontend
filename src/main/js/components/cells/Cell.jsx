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
import DisabledCell from "./disabled/DisabledCell.jsx";
import KeyboardShortcutsHelper from "../../helpers/KeyboardShortcutsHelper";
import CurrencyCell from "./currency/CurrencyCell.jsx";
import DateCell from "./date/DateCell";
import connectToAmpersand from "../helperComponents/connectToAmpersand";
import classNames from "classnames";
import * as f from "lodash/fp";
import {addTranslationNeeded, deleteCellAnnotation, removeTranslationNeeded} from "../../helpers/annotationHelper";
import openTranslationDialog from "../overlay/TranslationDialog";
import {either} from "../../helpers/functools";
import FlagIconRenderer from "./FlagIconRenderer";
import {branch, compose, renderNothing, withHandlers} from "recompose";

const ExpandCorner = compose(
  branch(
    ({show}) => !show,
    renderNothing
  ),
  withHandlers({
    onClick: (props) => (event) => {
      event.stopPropagation();
      ActionCreator.toggleRowExpand(props.cell.row.getId());
    }
  })
)(
  (props) => (
    <div className="needs-translation-other-language"
         onClick={props.onClick}
    />
  )
);

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

  const translationAnnotation = f.get(["annotations", "translationNeeded"], cell) || {};
  const translationsExist = untranslated.length !== Langtags.length - 1;
  const allFlaggedForTranslation = f.size(translationAnnotation.langtags) === Langtags.length - 1;

  if (isPrimaryLanguage && allFlaggedForTranslation) { // no need to ask for further flagging
    return;
  }

  if (isPrimaryLanguage) {
    const flagAllTranslations = () => addTranslationNeeded(f.drop(1, Langtags), cell);
    const flagEmptyTranslations = () => (!f.isEmpty(untranslated))
      ? addTranslationNeeded(untranslated, cell)
      : f.noop;
    if (translationsExist) {
      const column = cell.column;
      const columnName = f.get(["displayName", langtag], column)
        || f.get(["displayName", FallBackLanguage], column)
        || f.get(["displayName"], column);
      openTranslationDialog(columnName, flagAllTranslations, flagEmptyTranslations);
    } else {
      flagEmptyTranslations();
    }
  } else {
    const remainingTranslations = f.remove(f.equals(langtag), f.get("langtags", translationAnnotation));
    if (f.contains(langtag, f.get("langtags", translationAnnotation))) {
      removeTranslationNeeded(langtag, cell);
      if (f.isEmpty(remainingTranslations)) {
        deleteCellAnnotation(translationAnnotation, cell);
      }
    }
  }
};

@connectToAmpersand
class Cell extends React.PureComponent {

  cellDOMNode = null;

  constructor(props) {
    super(props);
    this.keyboardShortcuts = {};
    this.props.watch(this.props.cell,
      {
        event: "change:value",
        force: true
      });
    this.props.watch(this.props.cell,
      {
        event: "change:annotations",
        force: true
      });
  };

  componentDidMount = () => {
    this.cellDOMNode = ReactDOM.findDOMNode(this);
    this.checkFocus();
  };

  componentDidUpdate = () => {
    this.checkFocus();
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
      if (cellDOMNode && !focusedElement || !cellDOMNode.contains(focusedElement) || focusedElement.isEqualNode(cellDOMNode)) {
        cellDOMNode.focus();
      }
    }
  };

  cellClickedWorker = (event, withRightClick) => {
    let {cell, editing, selected, langtag, shouldFocus} = this.props;
    ActionCreator.closeAnnotationsPopup();
    window.devLog((cell.isMultiLanguage) ? "multilanguage" : "", cell.kind, "cell clicked", langtag, ":", cell, "value: ", cell.value, cell.displayValue);

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
    const {annotationsOpen, cell, langtag, selected, editing, inSelectedRow, isExpandedCell} = this.props;
    const {link, attachment, numeric, group, boolean, date, datetime, shorttext, concat, currency, text, richtext} = ColumnKinds;
    const noKeyboard = [concat, "disabled", text, richtext];

    if (isExpandedCell
      && (
        !cell.isMultiLanguage
        || f.contains(cell.kind, [ColumnKinds.link, ColumnKinds.boolean, ColumnKinds.attachment])
      )
    ) {
      return (
        <div className="cell repeat placeholder"
             onContextMenu={this.rightClicked}
        >
          —.—
        </div>
      );
    }

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
    const needsTranslationOtherLanguages = !f.isEmpty(f.prop("langtags", translationNeeded)) && isPrimaryLanguage;
    const cssClass = classNames(`cell cell-${kind} cell-${cell.column.getId()}-${cell.rowId}`,
      {
        "selected": selected,
        "editing": cell.isEditable && editing,
        "in-selected-row": inSelectedRow
      }
    );

    const CellKind = (kind === "disabled")
      ? DisabledCell
      : (cellKinds[kind] || TextCell);

    // onKeyDown event just for selected components
    return (
      <div style={this.props.style}
           className={cssClass} onClick={this.cellClicked} onContextMenu={this.rightClicked}
           tabIndex="-1"
           onKeyDown={(selected) ? KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts) : f.noop}
           onMouseDown={this.onMouseDownHandler}>
        <CellKind cell={cell} langtag={langtag}
                  selected={selected} inSelectedRow={inSelectedRow}
                  editing={cell.isEditable && editing}
                  contentChanged={contentChanged(cell, langtag)}
                  setCellKeyboardShortcuts={(f.contains(kind, noKeyboard)) ? f.noop : this.setKeyboardShortcutsForChildren}
        />
        <FlagIconRenderer cell={cell}
                          annotations={cell.annotations}
                          langtag={langtag}
                          annotationsOpen={annotationsOpen}
        />
        <ExpandCorner show={needsTranslationOtherLanguages}
                      cell={cell}
        />
      </div>
    );
  }
}

Cell.propTypes = {
  cell: React.PropTypes.object.isRequired,
  langtag: React.PropTypes.string.isRequired,
  selected: React.PropTypes.bool,
  inSelectedRow: React.PropTypes.bool,
  editing: React.PropTypes.bool,
  row: React.PropTypes.object.isRequired,
  table: React.PropTypes.object.isRequired,
  shouldFocus: React.PropTypes.bool,
  annotationsOpen: React.PropTypes.bool,
  isExpandedCell: React.PropTypes.bool.isRequired
};

export default Cell;
