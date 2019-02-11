import { branch, compose, renderNothing, withHandlers } from "recompose";
import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import f from "lodash/fp";
import { ColumnKinds, Langtags } from "../../constants/TableauxConstants";
import { either } from "../../helpers/functools";
import {
  hasUserAccessToCountryCode,
  hasUserAccessToLanguage,
  isUserAdmin
} from "../../helpers/accessManagementHelper";
import { isLocked } from "../../helpers/annotationHelper";
import AttachmentCell from "./attachment/AttachmentCell.jsx";
import BooleanCell from "./boolean/BooleanCell";
import CurrencyCell from "./currency/CurrencyCell.jsx";
import DateCell from "./date/DateCell";
import DisabledCell from "./disabled/DisabledCell.jsx";
import FlagIconRenderer from "./FlagIconRenderer";
import IdentifierCell from "./identifier/IdentifierCell.jsx";
import KeyboardShortcutsHelper from "../../helpers/KeyboardShortcutsHelper";
import LinkCell from "./link/LinkCell.jsx";
import NumericCell from "./numeric/NumericCell.jsx";
import ShortTextCell from "./text/ShortTextCell.jsx";
import TextCell from "./text/TextCell.jsx";

const ExpandCorner = compose(
  branch(({ show }) => !show, renderNothing),
  withHandlers({
    onClick: () => event => {
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

  return f.join("-", [flags, translations, comments, isLocked(cell.row)]);
};

export const contentChanged = (cell, langtag, oldValue) => value => {
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
    const cell = this.props.cell;
    const nextCell = nextProps.cell;

    return (
      !f.eq(cell.value, nextCell.value) ||
      !f.eq(cell.displayValue, nextCell.displayValue) ||
      !f.eq(cell.annotations, nextCell.annotations) ||
      this.props.selected !== nextProps.selected ||
      this.props.inSelectedRow !== nextProps.inSelectedRow ||
      this.props.editing !== nextProps.editing ||
      this.props.annotationsOpen !== nextProps.annotationsOpen
    );
  };

  getKeyboardShortcuts = event => {
    return this.keyboardShortcuts;
  };

  setKeyboardShortcutsForChildren = childrenEvents => {
    this.keyboardShortcuts = childrenEvents;
  };

  openCellContextMenu = this.props.openCellContextMenu({
    langtag: this.props.langtag,
    cell: this.props.cell
  });

  cellClickedWorker = (event, withRightClick) => {
    const { actions, cell, editing, selected, langtag } = this.props;
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
    const { table, column, row } = cell;

    if (!withRightClick) {
      this.props.closeCellContextMenu();
    }

    // we select the cell when clicking or right clicking. Don't jump in edit mode when selected and clicking right
    if (!selected) {
      actions.toggleCellSelection({
        columnId: column.id,
        rowId: row.id,
        langtag,
        tableId: table.id
      });
    } else if (!withRightClick) {
      actions.toggleCellEditing({ row });
    }

    if (withRightClick) {
      event.preventDefault();
      this.openCellContextMenu(event);
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
    console.error("Could not render cell:", this.props.cell, error);
    console.warn(info);
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

  userCanEditValue() {
    const {
      cell: { column },
      langtag
    } = this.props;
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

  //   componentDidUpdate = reportUpdateReasons(
  //     `${this.props.column.kind}-cell-${this.props.row.id}-${
  //       this.props.column.id
  //     }-${this.props.langtag}`
  //   );

  render() {
    const {
      annotationsOpen,
      cell,
      value,
      allDisplayValues,
      langtag,
      selected,
      editing,
      inSelectedRow,
      focusTable,
      toggleAnnotationPopup
    } = this.props;
    const { concat, text, richtext } = ColumnKinds;
    const { column, row, table } = cell;
    const noKeyboard = [concat, "disabled", text, richtext];
    const kind = column.kind;
    //       this.userCanEditValue() || column.kind === ColumnKinds.concat
    //         ? column.kind
    //         : "disabled";
    const { translationNeeded } = cell.annotations || {};
    const isPrimaryLanguage = langtag === f.first(Langtags);
    const needsTranslationOtherLanguages =
      !f.isEmpty(f.prop("langtags", translationNeeded)) && isPrimaryLanguage;
    const cssClass = classNames(`cell cell-${kind} ${cell.id}`, {
      selected: selected,
      editing: this.userCanEditValue() && editing,
      "in-selected-row": inSelectedRow
    });

    const CellKind =
      kind === "disabled" ? DisabledCell : Cell.cellKinds[kind] || TextCell;

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
          table={table}
          row={row}
          actions={this.props.actions}
          value={value}
          displayValue={cell.displayValue}
          allDisplayValues={
            column.kind === ColumnKinds.link ? allDisplayValues : null
          }
          column={column}
          key={`${column.id}-${langtag}-${cell.displayValue[langtag]}`}
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
          cell={cell}
        />
        <FlagIconRenderer
          cell={cell}
          annotationState={getAnnotationState(cell)}
          langtag={langtag}
          annotationsOpen={annotationsOpen}
          toggleAnnotationPopup={toggleAnnotationPopup}
        />
        <ExpandCorner show={needsTranslationOtherLanguages} cell={cell} />
      </div>
    );
  }
}

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

Cell.propTypes = {
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  inSelectedRow: PropTypes.bool,
  editing: PropTypes.bool,
  annotationsOpen: PropTypes.bool,
  toggleAnnotationPopup: PropTypes.func.isRequired,
  isExpandedCell: PropTypes.bool.isRequired
};
