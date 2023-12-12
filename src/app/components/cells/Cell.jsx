import {
  branch,
  compose,
  pure,
  renderComponent,
  renderNothing,
  withHandlers
} from "recompose";
import React from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";
import classNames from "classnames";

import { ColumnKinds, Langtags } from "../../constants/TableauxConstants";
import {
  canUserChangeCell,
  canUserChangeAnyCountryTypeCell
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
import StatusCell from "./status/StatusCell.jsx";
import reduxActionHoc from "../../helpers/reduxActionHoc";
import { getModifiers } from "../../helpers/modifierState";

const mapStateToProps = (state, props) => {
  const { cell, langtag } = props;
  const {
    selectedCell: { selectedCell, editing }
  } = state;
  const rowId = cell.row.id;
  const columnId = cell.column.id;
  const selected =
    selectedCell.rowId === rowId &&
    columnId === selectedCell.columnId &&
    langtag === selectedCell.langtag;
  const inSelectedRow =
    rowId === selectedCell.rowId &&
    (f.isEmpty(langtag) || langtag === selectedCell.langtag);
  return { selected, editing: selected && editing, inSelectedRow };
};

const ExpandCorner = compose(
  branch(({ show }) => !show, renderNothing),
  withHandlers({
    onClick: ({ actions: { toggleExpandedRow }, cell: { row } }) => event => {
      event.stopPropagation();
      toggleExpandedRow({ rowId: row.id });
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

class Cell extends React.Component {
  cellDOMNode = null;

  constructor(props) {
    super(props);
    this.keyboardShortcuts = {};
  }

  shouldComponentUpdate = nextProps => {
    const cell = this.props.cell;
    const nextCell = nextProps.cell;
    const getRelevantCellProps = f.pick([
      "value",
      "displayValue",
      "annotations"
    ]);

    return (
      (this.props.cell.kind === ColumnKinds.link &&
        this.props.width !== nextProps.width) ||
      this.props.langtag !== nextProps.langtag ||
      cell.id !== nextCell.id ||
      this.props.selected !== nextProps.selected ||
      this.props.inSelectedRow !== nextProps.inSelectedRow ||
      this.props.editing !== nextProps.editing ||
      this.props.annotationsOpen !== nextProps.annotationsOpen ||
      !f.isEqual(
        getRelevantCellProps(this.props.cell),
        getRelevantCellProps(nextProps.cell)
      )
    );
  };

  getKeyboardShortcuts = () => {
    return this.keyboardShortcuts;
  };

  setKeyboardShortcutsForChildren = childrenEvents => {
    this.keyboardShortcuts = childrenEvents;
  };

  openCellContextMenu = event =>
    this.props.openCellContextMenu({
      langtag: this.props.langtag,
      cell: this.props.cell
    })(event);

  cellClickedWorker = (event, withRightClick) => {
    const { actions, cell, editing, selected, langtag } = this.props;
    const { table, column, row } = cell;
    const modifiers = getModifiers(event);

    if (!withRightClick) {
      this.props.closeCellContextMenu();
      if (modifiers.none) {
        actions.clearMultiSelect();
      } else if (modifiers.mod) {
        actions.toggleMultiselectCell({ cell });
      }
    }

    // we select the cell when clicking or right clicking. Don't jump in edit mode when selected and clicking right
    if (!selected) {
      actions.toggleCellSelection({
        columnId: column.id,
        rowId: row.id,
        langtag,
        tableId: table.id
      });
    } else if (!withRightClick && this.userCanEditValue()) {
      actions.toggleCellEditing({ row, cell, eventKey: event.key });
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
    [ColumnKinds.integer]: NumericCell,
    [ColumnKinds.boolean]: BooleanCell,
    [ColumnKinds.date]: DateCell,
    [ColumnKinds.datetime]: DateCell,
    [ColumnKinds.shorttext]: ShortTextCell,
    [ColumnKinds.concat]: IdentifierCell,
    [ColumnKinds.currency]: CurrencyCell,
    [ColumnKinds.text]: TextCell,
    [ColumnKinds.richtext]: TextCell,
    [ColumnKinds.group]: IdentifierCell,
    [ColumnKinds.status]: StatusCell
  };

  userCanEditValue() {
    const {
      cell,
      cell: { column },
      langtag
    } = this.props;
    return column.multilanguage && column.languageType === "country"
      ? canUserChangeAnyCountryTypeCell(cell)
      : canUserChangeCell(cell, langtag);
  }

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
      toggleAnnotationPopup,
      width,
      rowIndex
    } = this.props;
    const { concat, text, richtext } = ColumnKinds;
    const { column, row, table } = cell;
    const noKeyboard = [concat, "disabled", text, richtext];
    const kind = column.kind;
    const { translationNeeded } = cell.annotations || {};
    const isPrimaryLanguage = langtag === f.first(Langtags);
    const needsTranslationOtherLanguages =
      !f.isEmpty(f.prop("langtags", translationNeeded)) && isPrimaryLanguage;
    const cssClass = classNames(`cell cell-${kind} ${cell.id}`, {
      selected: selected,
      editing: this.userCanEditValue() && editing,
      "in-selected-row": inSelectedRow,
      "cell-disabled": cell.isReadOnly
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
          editing={this.userCanEditValue() && editing}
          isMultiLanguage={column.multilanguage}
          setCellKeyboardShortcuts={
            f.contains(kind, noKeyboard)
              ? f.noop
              : this.setKeyboardShortcutsForChildren
          }
          cell={cell}
          width={width}
          rowIndex={rowIndex}
        />
        <FlagIconRenderer
          cell={cell}
          annotationState={getAnnotationState(cell)}
          langtag={langtag}
          annotationsOpen={annotationsOpen}
          toggleAnnotationPopup={toggleAnnotationPopup}
        />
        <ExpandCorner
          actions={this.props.actions}
          show={needsTranslationOtherLanguages}
          cell={cell}
        />
      </div>
    );
  }
}

const isRepeaterCell = ({ cell, isExpandedCell }) =>
  isExpandedCell &&
  (!cell.column.multilanguage ||
    f.contains(cell.kind, [ColumnKinds.link, ColumnKinds.attachment]));

const RepeaterCell = withHandlers({
  onContextMenu: ({
    openCellContextMenu,
    cell,
    langtag,
    actions: { toggleCellSelection }
  }) => event => {
    event.preventDefault();
    toggleCellSelection({ cell, langtag });
    openCellContextMenu({ cell, langtag: f.first(Langtags) })(event);
  }
})(props => (
  <div className="cell repeat placeholder" onContextMenu={props.onContextMenu}>
    —.—
  </div>
));

export default compose(
  branch(isRepeaterCell, renderComponent(pure(RepeaterCell))),
  pure
)(reduxActionHoc(Cell, mapStateToProps));

Cell.propTypes = {
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  inSelectedRow: PropTypes.bool,
  editing: PropTypes.bool,
  annotationsOpen: PropTypes.bool,
  toggleAnnotationPopup: PropTypes.func.isRequired,
  isExpandedCell: PropTypes.bool.isRequired,
  width: PropTypes.number.isRequired,
  rowIndex: PropTypes.number
};
