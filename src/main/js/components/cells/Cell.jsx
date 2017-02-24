import React from "react";
import ReactDOM from "react-dom";
import ActionCreator from "../../actions/ActionCreator";
import {ColumnKinds} from "../../constants/TableauxConstants";
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

// used to measure when the the cell hint is shown below the selected cell (useful when selecting the very first visible row)
const CELL_HINT_PADDING = 40;

@connectToAmpersand
class Cell extends React.Component {

  cellDOMNode = null;

  constructor(props) {
    super(props);
    this.state = {
      keyboardShortcuts: {}
    };
    this.props.watch(this.props.cell, {event: "change:value", force: true});
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
    return this.state.keyboardShortcuts;
  };

  setKeyboardShortcutsForChildren = (childrenEvents) => {
    this.setState({
      keyboardShortcuts: childrenEvents
    });
  };

  checkFocus = () => {
    if (this.props.selected && !this.props.editing && this.props.shouldFocus) {
      var cellDOMNode = this.cellDOMNode;
      var focusedElement = document.activeElement;
      // Is current focus this cell or inside of cell don't change the focus. This way child components can force their focus. (e.g. Links Component)
      if (!focusedElement || !cellDOMNode.contains(focusedElement) || focusedElement.isEqualNode(cellDOMNode)) {
        console.log("Cell will force focus");
        cellDOMNode.focus();
      }
    }
  };

  cellClickedWorker = (event, withRightClick) => {
    let {cell, editing, selected, langtag, shouldFocus} = this.props;
    console.log("cell clicked: ", cell, "value: ", cell.value);

    // we select the cell when clicking or right clicking. Don't jump in edit mode when selected and clicking right
    if (!selected) {
      ActionCreator.toggleCellSelection(cell, selected, langtag);
    } else if (!withRightClick) {
      ActionCreator.toggleCellEditing();
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
    let cellKind = null;
    const {cell, langtag, selected, editing} = this.props;

    const kind = cell.isEditable ? this.props.cell.kind : "disabled";

    switch (kind) {

      case ColumnKinds.link:
        cellKind = <LinkCell cell={this.props.cell} langtag={langtag} selected={selected}
                             editing={editing}
                             setCellKeyboardShortcuts={this.setKeyboardShortcutsForChildren}/>;
        break;

      case ColumnKinds.attachment:
        cellKind = <AttachmentCell cell={this.props.cell} langtag={langtag} selected={selected}
                                   editing={editing}
                                   setCellKeyboardShortcuts={this.setKeyboardShortcutsForChildren}/>;
        break;

      case ColumnKinds.numeric:
        cellKind = <NumericCell cell={this.props.cell} langtag={langtag} editing={editing}
                                setCellKeyboardShortcuts={this.setKeyboardShortcutsForChildren}/>;
        break;

      case ColumnKinds.boolean:
        cellKind = <BooleanCell cell={this.props.cell} langtag={langtag} selected={selected}
                                setCellKeyboardShortcuts={this.setKeyboardShortcutsForChildren}/>;
        break;

      case ColumnKinds.datetime:
        cellKind = <DateTimeCell cell={this.props.cell} langtag={langtag} editing={editing}
                                 setCellKeyboardShortcuts={this.setKeyboardShortcutsForChildren}/>;
        break;

      case ColumnKinds.date:
        cellKind = <DateCell cell={this.props.cell} langtag={langtag} editing={editing}
                             setCellKeyboardShortcuts={this.setKeyboardShortcutsForChildren} />;
        break;

      case ColumnKinds.shorttext:
        cellKind = <ShortTextCell cell={this.props.cell} langtag={langtag} editing={editing}
                                  setCellKeyboardShortcuts={this.setKeyboardShortcutsForChildren}/>;
        break;

      case ColumnKinds.concat:
        cellKind = <IdentifierCell cell={this.props.cell} langtag={langtag} selected={selected}
                                   editing={editing}/>;
        break;

      case ColumnKinds.currency:
        cellKind = <CurrencyCell cell={this.props.cell} langtag={langtag} selected={selected}
                                 editing={editing} setCellKeyboardShortcuts={this.setKeyboardShortcutsForChildren}/>;
        break;

      case "disabled":
        cellKind = <DisabledCell cell={this.props.cell} langtag={langtag} selected={selected}/>;
        break;

      default:
        cellKind = <TextCell cell={this.props.cell} langtag={langtag} editing={editing}
                             selected={selected}/>;
        break;
    }

    let cellClass = "cell" + " cell-" + kind + " cell-" + cell.column.getId() + "-" + cell.rowId;

    if (selected) {
      cellClass += " selected";
    }

    if (editing && cell.isEditable) {
      cellClass += " editing";
    }

    // onKeyDown event just for selected components
    if (selected) {
      const firstCell = cell.collection.at(0);
      const indexOfCell = cell.collection.indexOf(cell);
      const rowDisplayLabel = RowConcatHelper.getCellAsStringWithFallback(firstCell.value, firstCell.column, langtag);
      // get global so not every single cell needs to look fo the table rows dom element
      const tableRowsDom = window.GLOBAL_TABLEAUX.tableRowsDom;
      const difference = this.cellOffset - tableRowsDom.scrollTop;
      let rowDisplayLabelClass = "row-display-label";

      if (-CELL_HINT_PADDING < difference && difference < CELL_HINT_PADDING) {
        rowDisplayLabelClass += " flip";
      }

      // We just show the info starting at the fourth column
      const rowDisplayLabelElement = indexOfCell >= 3 ? (
        <div className={rowDisplayLabelClass}><span className="content">{langtag} | {rowDisplayLabel}</span>
        </div>) : null;

      return (
        <div className={cellClass} onClick={this.cellClicked} onContextMenu={this.rightClicked}
             tabIndex="-1" onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
             onMouseDown={this.onMouseDownHandler}>
          {cellKind}
          {rowDisplayLabelElement}
        </div>
      );
    } else {
      return (
        <div className={cellClass} onClick={this.cellClicked} onContextMenu={this.rightClicked}
             tabIndex="-1">
          {cellKind}
        </div>
      );
    }
  }
};

Cell.propTypes = {
  cell: React.PropTypes.object.isRequired,
  langtag: React.PropTypes.string.isRequired,
  selected: React.PropTypes.bool,
  editing: React.PropTypes.bool,
  row: React.PropTypes.object.isRequired,
  table: React.PropTypes.object.isRequired,
  shouldFocus: React.PropTypes.bool
};

export default Cell;
