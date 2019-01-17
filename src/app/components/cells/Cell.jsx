import React from "react";
// import ActionCreator from "../../actions/ActionCreator";
import {
  ColumnKinds,
  FallBackLanguage,
  Langtags
} from "../../constants/TableauxConstants";
import TextCell from "./text/TextCell.jsx";
import ShortTextCell from "./text/ShortTextCell.jsx";
import NumericCell from "./numeric/NumericCell.jsx";
import LinkCell from "./link/LinkCell.jsx";
import AttachmentCell from "./attachment/AttachmentCell.jsx";
import BooleanCell from "./boolean/BooleanCell";
import IdentifierCell from "./identifier/IdentifierCell.jsx";
import DisabledCell from "./disabled/DisabledCell.jsx";
import KeyboardShortcutsHelper from "../../helpers/KeyboardShortcutsHelper";
import CurrencyCell from "./currency/CurrencyCell.jsx";
import DateCell from "./date/DateCell";
import classNames from "classnames";
import f from "lodash/fp";
// import {
//   addTranslationNeeded, deleteCellAnnotation, isLocked,
//   removeTranslationNeeded
// } from "../../helpers/annotationHelper";
// import openTranslationDialog from "../overlay/TranslationDialog";
import { either, doto } from "../../helpers/functools";
// import FlagIconRenderer from "./FlagIconRenderer";
import {
  branch,
  compose,
  pure,
  renderComponent,
  renderNothing,
  withHandlers
} from "recompose";
import PropTypes from "prop-types";
import getDisplayValue from "../../helpers/getDisplayValue";
import {
  isUserAdmin,
  hasUserAccessToLanguage
} from "../../helpers/accessManagementHelper";

const FlagIconRenderer = () => null;
const ExpandCorner = compose(
  branch(({ show }) => !show, renderNothing),
  withHandlers({
    onClick: props => event => {
      event.stopPropagation();
      // ActionCreator.toggleRowExpand(props.cell.row.getId());
    }
  })
)(props => (
  <div className="needs-translation-other-language" onClick={props.onClick} />
));

export const getAnnotationState = cell => {
  const flags = f.flow(
    f.keys,
    f.filter(f.contains(f, ["important", "check-me", "postpone"])),
    f.join(":")
  )(cell.annotations);

  const translations = f.flow(
    f.get(["translationNeeded", "langtags"]),
    f.join(":")
  )(cell.annotations);

  const comments = f.flow(
    f.pick(["info", "error", "warning"]),
    f.reduce(f.concat, []),
    f.map(
      f.flow(
        f.get("uuid"),
        f.take(8),
        f.join("")
      )
    ),
    f.join(":")
  )(cell.annotations);

  // return f.join("-", [flags, translations, comments, isLocked(cell.row)]);
};

export const contentChanged = (cell, langtag, oldValue) => () => {
  if (
    !cell.isMultiLanguage ||
    either(cell)
      .map(f.prop(["value", langtag]))
      .orElse(f.prop("value")).value === oldValue
  ) {
    return;
  }
  const isPrimaryLanguage = langtag === f.first(Langtags);
  const untranslated = f.flow(
    f.drop(1),
    f.filter(lt => f.isEmpty(f.prop([lt], value)))
  )(Langtags);

  const translationAnnotation =
    f.get(["annotations", "translationNeeded"], cell) || {};
  const translationsExist = untranslated.length !== Langtags.length - 1;
  const allFlaggedForTranslation =
    f.size(translationAnnotation.langtags) === Langtags.length - 1;

  if (isPrimaryLanguage && allFlaggedForTranslation) {
    // no need to ask for further flagging
    return;
  }

  // if (isPrimaryLanguage) {
  //   const flagAllTranslations = () => addTranslationNeeded(f.drop(1, Langtags), cell);
  //   const flagEmptyTranslations = () => (!f.isEmpty(untranslated))
  //     ? addTranslationNeeded(untranslated, cell)
  //     : f.noop;
  //   if (translationsExist) {
  //     const column = cell.column;
  //     const columnName = f.get(["displayName", langtag], column)
  //       || f.get(["displayName", FallBackLanguage], column)
  //       || f.get(["name"], column);
  //     // openTranslationDialog(columnName, flagAllTranslations, flagEmptyTranslations);
  //   } else {
  //     flagEmptyTranslations();
  //   }
  // } else {
  //   const remainingTranslations = f.remove(f.equals(langtag), f.get("langtags", translationAnnotation));
  //   if (f.contains(langtag, f.get("langtags", translationAnnotation))) {
  //     removeTranslationNeeded(langtag, cell);
  //     if (f.isEmpty(remainingTranslations)) {
  //       deleteCellAnnotation(translationAnnotation, cell);
  //     }
  //   }
  // }
};

class Cell extends React.Component {
  cellDOMNode = null;

  constructor(props) {
    super(props);
    this.keyboardShortcuts = {};
  }

  shouldComponentUpdate = nextProps => {
    const keys = f.keys(nextProps);
    const changes = keys.filter(
      key =>
        key != "columns" &&
        key !== "column" &&
        key !== "row" &&
        f.complement(f.equals)(this.props[key], nextProps[key])
    );
    return changes.length > 0;
  };

  getKeyboardShortcuts = event => {
    return this.keyboardShortcuts;
  };

  setKeyboardShortcutsForChildren = childrenEvents => {
    this.keyboardShortcuts = childrenEvents;
  };

  cellClickedWorker = (event, withRightClick) => {
    const {
      actions,
      table,
      row,
      column,
      editing,
      selected,
      langtag
    } = this.props;
    // ActionCreator.closeAnnotationsPopup();
    // console.log(
    //   cell.isMultiLanguage ? "multilanguage" : "",
    //   cell.kind,
    //   "cell clicked",
    //   langtag,
    //   ":",
    //   cell,
    //   "value: ",
    //   cell.value,
    //   cell.displayValue
    // );

    // we select the cell when clicking or right clicking. Don't jump in edit mode when selected and clicking right
    if (!selected) {
      actions.toggleCellSelection({
        columnId: column.id,
        rowId: row.id,
        langtag,
        tableId: table.id
      });
    } else if (!withRightClick) {
      actions.toggleCellEditing();
    }

    if (withRightClick) {
      event.preventDefault();
      // ActionCreator.showRowContextMenu(this.props.row, langtag, event.pageX, event.pageY, this.props.table, cell);
    }

    if (!withRightClick || editing) {
      /*
       Important to block the click listener of Table. This helps focusing the cell when clicked but prevents from scrolling
       the table view when clicking on an element other than the cell.
       */
      event.stopPropagation();
    }
  };

  rightClicked = event => {
    this.cellClickedWorker(event, true);
  };

  cellClicked = event => {
    this.cellClickedWorker(event);
  };

  onMouseDownHandler = e => {
    // Prevents table mousedown handler, so we can select
    e.stopPropagation();
  };

  componentDidCatch(error, info) {
    console.error(
      "Could not render cell:",
      "column",
      this.props.column,
      "row",
      this.props.row,
      error
    );
  }

  static cellKinds = {
    [ColumnKinds.link]: LinkCell,
    [ColumnKinds.attachment]: AttachmentCell,
    [ColumnKinds.numeric]: NumericCell,
    [ColumnKinds.boolean]: BooleanCell,
    [ColumnKinds.date]: DateCell,
    [ColumnKinds.datetime]: DateCell,
    [ColumnKinds.shorttext]: ShortTextCell,
    [ColumnKinds.concat]: IdentifierCell,
    [ColumnKinds.currency]: CurrencyCell,
    [ColumnKinds.text]: TextCell,
    [ColumnKinds.richtext]: TextCell,
    [ColumnKinds.group]: IdentifierCell
  };

  componentWillUpdate(nextProps) {
    const keys = f.keys(nextProps);
    const { column, row } = this.props;
    const cellid = `${column.id}/${row.id}`;
    const modifiedVals = f.filter(
      k => k !== "column" && k !== "row" && this.props[k] !== nextProps[k],
      keys
    );
    console.log(cellid, f.isEmpty(modifiedVals) ? "--" : modifiedVals);
  }

  userCanEditValue() {
    const { column, langtag, value } = this.props;
    if (column.kind === ColumnKinds.concat) {
      return false;
    }
    if (isUserAdmin()) {
      return true;
    }
    return (
      (column.multilanguage && hasUserAccessToLanguage(langtag)) ||
      (column.languageType === "country" && hasUserAccessToCountryCode(langtag))
    );
  }

  render() {
    const {
      annotationsOpen,
      value,
      displayValue,
      column,
      langtag,
      selected,
      editing,
      inSelectedRow,
      focusTable,
      rowId
    } = this.props;
    const { concat, text, richtext } = ColumnKinds;
    const noKeyboard = [concat, "disabled", text, richtext];
    const kind = column.kind;
    //       this.userCanEditValue() || column.kind === ColumnKinds.concat
    //         ? column.kind
    //         : "disabled";
    const { translationNeeded } = { translationNeeded: true }; //cell.annotations;
    const isPrimaryLanguage = langtag === f.first(Langtags);
    const needsTranslationOtherLanguages =
      !f.isEmpty(f.prop("langtags", translationNeeded)) && isPrimaryLanguage;
    const cssClass = classNames(
      `cell cell-${kind} cell-${column.id}-${rowId}`,
      {
        selected: selected,
        editing: this.userCanEditValue() && editing,
        "in-selected-row": inSelectedRow
      }
    );

    const CellKind =
      kind === "disabled" ? DisabledCell : Cell.cellKinds[kind] || TextCell;

    // const displayValue = f.isArray(cell.displayValue)
    //   ? f.flow(
    //       f.map(f.get(langtag)),
    //       f.join(";")
    //     )(cell.displayValue) || ""
    //   : f.get(langtag, cell.displayValue) || "";

    // onKeyDown event just for selected components
    return (
      <div
        style={this.props.style}
        className={cssClass}
        onClick={this.cellClicked}
        onContextMenu={this.rightClicked}
        tabIndex="1"
        onKeyDown={
          selected
            ? KeyboardShortcutsHelper.onKeyboardShortcut(
                this.getKeyboardShortcuts
              )
            : f.noop
        }
        onMouseDown={this.onMouseDownHandler}
      >
        <CellKind
          table={this.props.table}
          row={this.props.row}
          actions={this.props.actions}
          value={value}
          displayValue={displayValue}
          column={column}
          key={`${column.id}-${langtag}-${displayValue}`}
          langtag={langtag}
          focusTable={focusTable}
          selected={selected}
          inSelectedRow={inSelectedRow}
          editing={this.userCanEditValue && editing}
          contentChanged={contentChanged}
          isMultiLanguage={column.multilanguage}
          setCellKeyboardShortcuts={
            f.contains(kind, noKeyboard)
              ? f.noop
              : this.setKeyboardShortcutsForChildren
          }
          cell={{
            column: this.props.column,
            columns: this.props.columns,
            row: this.props.row,
            table: this.props.table,
            value: this.props.value,
            displayValue
          }}
        />
      </div>
    );
  }
}

// Cell.propTypes = {
//   cell: PropTypes.object.isRequired,
//   langtag: PropTypes.string.isRequired,
//   selected: PropTypes.bool,
//   inSelectedRow: PropTypes.bool,
//   editing: PropTypes.bool,
//   row: PropTypes.object.isRequired,
//   table: PropTypes.object.isRequired,
//   annotationsOpen: PropTypes.bool,
//   isExpandedCell: PropTypes.bool.isRequired
// };

const isRepeaterCell = ({ cell, isExpandedCell }) =>
  isExpandedCell &&
  (!cell.isMultiLanguage ||
    f.contains(cell.kind, [
      ColumnKinds.link,
      ColumnKinds.boolean,
      ColumnKinds.attachment
    ]));

const RepeaterCell = withHandlers({
  onContextMenu: ({ row, langtag, table, cell }) => event => {
    event.preventDefault();
    // ActionCreator.showRowContextMenu(row, langtag, event.pageX, event.pageY, table, cell);
  }
})(props => (
  <div className="cell repeat placeholder" onContextMenu={props.onContextMenu}>
    —.—
  </div>
));

/**
 * Placing pure HOC component around connectToAmpersand and making Cell itself a non-pure component
 * gives us the best of two worlds:
 * the pure HOC will avoid unneccessary re-renders, while a non-pure base component will not stop
 * connectToAmpersand from triggering new render cycles on value changes.
 */
// export default compose(
//   branch(
//     isRepeaterCell,
//     renderComponent(pure(RepeaterCell))
//   ),
//   pure,
//   connectToAmpersand
// )(Cell);
export default Cell;
