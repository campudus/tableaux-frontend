var React = require('react');
var ReactDOM = require('react-dom');
var AmpersandMixin = require('ampersand-react-mixin');
var ActionCreator = require('../../actions/ActionCreator');
var ColumnKinds = require('../../constants/TableauxConstants').ColumnKinds;

var TextCell = require('./text/TextCell.jsx');
var ShortTextCell = require('./text/ShortTextCell.jsx');
var NumericCell = require('./numeric/NumericCell.jsx');
var LinkCell = require('./link/LinkCell.jsx');
var AttachmentCell = require('./attachment/AttachmentCell.jsx');
var BooleanCell = require('./boolean/BooleanCell.jsx');
var DateTimeCell = require('./datetime/DateTimeCell.jsx');
var IdentifierCell = require('./identifier/IdentifierCell.jsx');
var RowConcatHelper = require('../../helpers/RowConcatHelper');

import KeyboardShortcutsHelper from '../../helpers/KeyboardShortcutsHelper';

//used to measure when the the cell hint is shown below the selected cell (useful when selecting the very first visible row)
const CELL_HINT_PADDING = 40;

var Cell = React.createClass({
  mixins : [AmpersandMixin],

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    selected : React.PropTypes.bool,
    editing : React.PropTypes.bool,
    shouldFocus : React.PropTypes.bool
  },

  cellDOMNode : null,

  getInitialState : function () {
    return {
      keyboardShortcuts : {}
    };
  },

  componentDidMount : function () {
    this.cellDOMNode = ReactDOM.findDOMNode(this);
    this.cellOffset = this.cellDOMNode.offsetTop;
    this.checkFocus();
  },

  componentDidUpdate : function () {
    this.checkFocus();
  },

  //Dont update when cell is not editing or selected
  shouldComponentUpdate : function (nextProps, nextState) {
    const {selected, editing, langtag,shouldFocus} = this.props;
    return (editing !== nextProps.editing
    || selected !== nextProps.selected
    || langtag !== nextProps.langtag
    || shouldFocus !== nextProps.shouldFocus)
  },

  getKeyboardShortcuts : function (event) {
    return this.state.keyboardShortcuts;
  },

  setKeyboardShortcutsForChildren : function (childrenEvents) {
    this.setState({
      keyboardShortcuts : childrenEvents
    });
  },

  checkFocus : function () {
    if (this.props.selected && !this.props.editing && this.props.shouldFocus) {
      var cellDOMNode = this.cellDOMNode;
      var focusedElement = document.activeElement;
      //Is current focus this cell or inside of cell don't change the focus. This way child components can force their focus. (e.g. Links Component)
      if (!focusedElement || !cellDOMNode.contains(focusedElement) || focusedElement.isEqualNode(cellDOMNode)) {
        console.log("Cell will force focus");
        cellDOMNode.focus();
      }
    }
  },

  cellClicked : function (event, reactId, nativeEvent, withRightClick) {
    let {cell, editing, selected, langtag, shouldFocus} = this.props;
    console.log("cell clicked: ", cell, "value: ", cell.value);

    //we select the cell when clicking or right clicking. Don't jump in edit mode when selected and clicking right
    if (!selected) {
      ActionCreator.toggleCellSelection(cell, selected, langtag);
    } else if (!withRightClick) {
      ActionCreator.toggleCellEditing();
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

  },

  rightClicked : function (e) {
    this.cellClicked(...arguments, true);
  },

  onMouseDownHandler : function (e) {
    //Prevents table mousedown handler, so we can select
    e.stopPropagation();
  },

  render : function () {
    let cellKind = null;
    const {cell, langtag, selected, editing} = this.props;

    switch (this.props.cell.kind) {

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

      case ColumnKinds.shorttext:
        cellKind = <ShortTextCell cell={this.props.cell} langtag={langtag} editing={editing}
                                  setCellKeyboardShortcuts={this.setKeyboardShortcutsForChildren}/>;
        break;

      case ColumnKinds.concat:
        cellKind = <IdentifierCell cell={this.props.cell} langtag={langtag} selected={selected}
                                   editing={editing}/>;
        break;

      default:
        cellKind = <TextCell cell={this.props.cell} langtag={langtag} editing={editing}
                             selected={selected}/>;
        break;
    }

    var cellClass = "cell" + " cell-" + cell.kind + " cell-" + cell.column.getId() + "-" + cell.rowId + (selected ? " selected" : "") + (editing ? " editing" : "");

    //onKeyDown event just for selected components
    if (selected) {
      const firstCell = cell.collection.at(0);
      const firstCellId = firstCell.id;
      const rowDisplayLabel = RowConcatHelper.getRowConcatStringWithFallback(firstCell.value, firstCell.column, langtag);
      //get global so not every single cell needs to look fo the table rows dom element
      const tableRowsDom = window.GLOBAL_TABLEAUX.tableRowsDom;
      const difference = this.cellOffset - tableRowsDom.scrollTop;
      let rowDisplayLabelClass = "row-display-label";

      if (-CELL_HINT_PADDING < difference && difference < CELL_HINT_PADDING) {
        rowDisplayLabelClass += " below";
      }

      const rowDisplayLabelElement = cell.id !== firstCellId ? (
        <div className={rowDisplayLabelClass}><span className="content">{rowDisplayLabel}</span></div>) : null;

      return (
        <div className={cellClass} onClick={this.cellClicked} onContextMenu={this.rightClicked}
             tabIndex="-1" onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
             onMouseDown={this.onMouseDownHandler}>
          {cellKind}
          {rowDisplayLabelElement}
        </div>
      )
    } else {
      return (
        <div className={cellClass} onClick={this.cellClicked} onContextMenu={this.rightClicked}
             tabIndex="-1">
          {cellKind}
        </div>
      )
    }


  }
});

module.exports = Cell;
