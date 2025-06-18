import classNames from "classnames";
import f from "lodash/fp";
import i18n from "i18next";
import PropTypes from "prop-types";
import React, { createRef } from "react";
import {
  branch,
  compose,
  pure,
  renderComponent,
  withHandlers
} from "recompose";
import { isRowArchived } from "../../archivedRows/helpers";
import { ColumnKinds, Langtags } from "../../constants/TableauxConstants";
import {
  canUserChangeAnyCountryTypeCell,
  canUserChangeCell
} from "../../helpers/accessManagementHelper";
import {
  getAnnotationByName,
  getAnnotationColor
} from "../../helpers/annotationHelper";
import KeyboardShortcutsHelper from "../../helpers/KeyboardShortcutsHelper";
import { getModifiers } from "../../helpers/modifierState";
import reduxActionHoc from "../../helpers/reduxActionHoc";
import AnnotationBar from "../annotation/AnnotationBar";
import AttachmentCell from "./attachment/AttachmentCell.jsx";
import BooleanCell from "./boolean/BooleanCell";
import CurrencyCell from "./currency/CurrencyCell.jsx";
import DateCell from "./date/DateCell";
import DisabledCell from "./disabled/DisabledCell.jsx";
import IdentifierCell from "./identifier/IdentifierCell.jsx";
import LinkCell from "./link/LinkCell.jsx";
import NumericCell from "./numeric/NumericCell.jsx";
import StatusCell from "./status/StatusCell.jsx";
import ShortTextCell from "./text/ShortTextCell.jsx";
import TextCell from "./text/TextCell.jsx";
import { hasPendingUnlockRequest, isLocked } from "../../helpers/rowUnlock";

const mapStateToProps = (state, props) => {
  const { cell, langtag } = props;
  const {
    selectedCell: { selectedCell, editing },
    multiSelect,
    tableView: { annotationHighlight }
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
  const inMultiSelection = f.map("id", multiSelect).includes(cell.id);
  return {
    selected,
    editing: selected && editing,
    inMultiSelection,
    inSelectedRow,
    annotationHighlight
  };
};

class Cell extends React.Component {
  cellDOMNode = null;

  constructor(props) {
    super(props);
    this.keyboardShortcuts = {};
    this.cellRef = createRef(null);
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
      (f.contains(cell.kind, [ColumnKinds.link, ColumnKinds.attachment]) &&
        this.props.width !== nextProps.width) ||
      this.props.langtag !== nextProps.langtag ||
      cell.id !== nextCell.id ||
      this.props.selected !== nextProps.selected ||
      this.props.inSelectedRow !== nextProps.inSelectedRow ||
      this.props.inMultiSelection !== nextProps.inMultiSelection ||
      this.props.editing !== nextProps.editing ||
      this.props.annotationsOpen !== nextProps.annotationsOpen ||
      this.props.annotationHighlight !== nextProps.annotationHighlight ||
      !f.isEqual(
        getRelevantCellProps(this.props.cell),
        getRelevantCellProps(nextProps.cell)
      ) ||
      cell.row.archived !== nextCell.row.archived
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

  cellClickedWorker = event => {
    requestAnimationFrame(() => {
      if (document.activeElement === document.body) {
        this.cellRef.current?.focus();
      }
    });

    const {
      actions,
      cell,
      columns,
      editing,
      isExpandedCell,
      rows,
      selected,
      visibleColumns: visibleColumnIds
    } = this.props;
    if (!editing) {
      event.stopPropagation();
    }

    const modifiers = getModifiers(event);
    this.props.closeCellContextMenu();
    if (modifiers.none) {
      actions.clearMultiselect();
    } else if (!isExpandedCell && modifiers.mod) {
      event.preventDefault();
      actions.toggleMultiselectCell({ cell });
    } else if (!isExpandedCell && modifiers.shift) {
      event.preventDefault();
      actions.toggleMultiselectArea({
        cell,
        columns: visibleColumnIds.map((id, idx) => ({
          ...f.find(col => col.id === id, columns),
          idx
        })),
        rows
      });
    }

    // we select the cell when clicking or right clicking. Don't jump in edit mode when selected and clicking right
    if (!selected && modifiers.none) {
      this.setSelfAsSelected();
    } else if (this.userCanEditValue() && modifiers.none) {
      actions.toggleCellEditing({ editing: true });

      if (!isLocked(cell.row)) {
        this.props.forceTableUpdate();
      }

      // only display hint if row isn't unlocked after 600ms
      // cancel hint if row is unlocked within 600ms
      this.unlockTimeoutId = window.setTimeout(() => {
        if (isLocked(cell.row) && hasPendingUnlockRequest(cell.row)) {
          actions.showToast({
            content: (
              <div id="cell-jump-toast">
                <h1>{i18n.t("table:final.unlock_header")}</h1>
                <p>{i18n.t("table:final.unlock_toast")}</p>
              </div>
            ),
            duration: 2000
          });
        } else {
          window.clearTimeout(this.unlockTimeoutId);
        }
      }, 600);
    }
  };

  unlockTimeoutId = null;

  setSelfAsSelected = () => {
    const {
      actions,
      cell: { column, row, table },
      langtag,
      setSelectedCellExpandedRow
    } = this.props;
    actions.toggleCellSelection({
      columnId: column.id,
      rowId: row.id,
      tableId: table.id,
      langtag
    });
    setSelectedCellExpandedRow?.(langtag);
  };

  rightClicked = event => {
    event.preventDefault();
    event.stopPropagation();
    this.openCellContextMenu(event);
    if (!this.props.selected) {
      this.setSelfAsSelected();
    }
  };

  cellClicked = event => {
    const withRightClick = event.button > 0;
    return withRightClick
      ? this.rightClicked(event)
      : this.cellClickedWorker(event);
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

  stopBubblingUp = event => {
    event.stopPropagation();
  };

  preventTextRangeSelection = event => {
    const modifiers = getModifiers(event);
    if (modifiers.shift || modifiers.mod) {
      event.preventDefault();
    }
  };

  render() {
    const {
      annotationsOpen,
      cell,
      value,
      allDisplayValues,
      langtag,
      userLangtag,
      isPrimaryLang,
      selected,
      editing,
      inMultiSelection,
      inSelectedRow,
      focusTable,
      toggleAnnotationPopup,
      width,
      rowIndex,
      style = {},
      annotationHighlight
    } = this.props;
    const { concat, text, richtext } = ColumnKinds;
    const { column, row, table } = cell;
    const noKeyboard = [concat, "disabled", text, richtext];
    const kind = column.kind;
    const cssClass = classNames(`cell cell-${kind} ${cell.id}`, {
      selected: selected,
      editing: this.userCanEditValue() && editing,
      "in-selected-row": inSelectedRow,
      "cell-disabled": cell.isReadOnly || !this.userCanEditValue(),
      "in-multi-selection": inMultiSelection,
      archived: isRowArchived(row)
    });

    const CellKind =
      kind === "disabled" ? DisabledCell : Cell.cellKinds[kind] || TextCell;

    const annotationColor = getAnnotationColor(annotationHighlight, "#ffffff");
    const hexTransparency = "33"; // hex transparency of 20%
    const highlightColor = annotationColor + hexTransparency;
    const annotation = getAnnotationByName(annotationHighlight, cell);
    const hasAnnotation = !!annotation;
    const shouldHighlight = hasAnnotation && !selected && isPrimaryLang;

    // onKeyDown event just for selected components
    return (
      <div
        ref={this.cellRef}
        style={{
          ...style,
          ...(shouldHighlight && { backgroundColor: highlightColor })
        }}
        className={cssClass}
        onClick={this.cellClicked}
        onMouseDown={this.preventTextRangeSelection}
        onContextMenu={this.rightClicked}
        tabIndex="1"
        onKeyDown={
          editing && kind !== "boolean"
            ? this.stopBubblingUp
            : selected
            ? KeyboardShortcutsHelper.onKeyboardShortcut(
                this.getKeyboardShortcuts
              )
            : f.noop
        }
      >
        <AnnotationBar
          cell={cell}
          langtag={langtag}
          userLangtag={userLangtag}
          annotationsOpen={annotationsOpen}
          toggleAnnotationPopup={toggleAnnotationPopup}
          isPrimaryLang={isPrimaryLang}
        />
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
  <div
    style={props.style}
    className="cell repeat placeholder"
    onContextMenu={props.onContextMenu}
  >
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
