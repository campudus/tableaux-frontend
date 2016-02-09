var React = require('react');
var ReactDOM = require('react-dom');
var AmpersandMixin = require('ampersand-react-mixin');
var KeyboardShortcutsMixin = require('../mixins/KeyboardShortcutsMixin');
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


var Cell = React.createClass({
  mixins : [AmpersandMixin, KeyboardShortcutsMixin],

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
    this.checkFocus();
  },

  componentWillMount : function () {

  },

  componentDidUpdate : function () {
    this.checkFocus();
  },

  componentWillUnmount : function () {

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

  cellClicked : function (e) {
    console.log("cell clicked: ", this.props.cell, "value: ", this.props.cell.value);
    if (this.props.selected === true) {
      ActionCreator.toggleCellEditing();
    } else {
      ActionCreator.toggleCellSelection(this.props.cell, this.props.selected, this.props.langtag);
    }

    /*
     Important to block the click listener of Table. This helps focusing the cell when clicked but prevents from scrolling
     the table view when clicking on an element other than the cell.
     */
    e.stopPropagation();
    if (!this.props.shouldFocus) {
      ActionCreator.enableShouldCellFocus();
    }

  },

  onMouseDownHandler : function (e) {
    //Prevents table mousedown handler, so we can select
    e.stopPropagation();
  },

  render : function () {
    var cellKind = null;
    var cell = this.props.cell;

    switch (this.props.cell.kind) {

      case ColumnKinds.link:
        cellKind = <LinkCell cell={this.props.cell} langtag={this.props.langtag} selected={this.props.selected}
                             editing={this.props.editing}
                             setCellKeyboardShortcuts={this.setKeyboardShortcutsForChildren}/>;
        break;

      case ColumnKinds.attachment:
        cellKind = <AttachmentCell cell={this.props.cell} langtag={this.props.langtag} selected={this.props.selected}
                                   editing={this.props.editing}
                                   setCellKeyboardShortcuts={this.setKeyboardShortcutsForChildren}/>;
        break;

      case ColumnKinds.numeric:
        cellKind = <NumericCell cell={this.props.cell} langtag={this.props.langtag} editing={this.props.editing}
                                setCellKeyboardShortcuts={this.setKeyboardShortcutsForChildren}/>;
        break;

      case ColumnKinds.boolean:
        cellKind = <BooleanCell cell={this.props.cell} langtag={this.props.langtag} selected={this.props.selected}
                                setCellKeyboardShortcuts={this.setKeyboardShortcutsForChildren}/>;
        break;

      case ColumnKinds.datetime:
        cellKind = <DateTimeCell cell={this.props.cell} langtag={this.props.langtag} editing={this.props.editing}
                                 setCellKeyboardShortcuts={this.setKeyboardShortcutsForChildren}/>;
        break;

      case ColumnKinds.shorttext:
        cellKind = <ShortTextCell cell={this.props.cell} langtag={this.props.langtag} editing={this.props.editing}/>;
        break;

      case ColumnKinds.concat:
        cellKind = <IdentifierCell cell={this.props.cell} langtag={this.props.langtag} selected={this.props.selected}
                                   editing={this.props.editing}/>;
        break;

      default:
        cellKind = <TextCell cell={this.props.cell} langtag={this.props.langtag} editing={this.props.editing}
                             selected={this.props.selected}/>;
        break;
    }

    var cellClass = "cell" + " cell-" + cell.kind + " cell-" + cell.column.getId() + "-" + cell.rowId + (this.props.selected ? " selected" : "") + (this.props.editing ? " editing" : "");

    //onKeyDown event just for selected components
    if (this.props.selected) {
      return (
        <div className={cellClass} onClick={this.cellClicked} tabIndex="-1" onKeyDown={this.onKeyboardShortcut}
             onMouseDown={this.onMouseDownHandler}>
          {cellKind}
        </div>
      )
    } else {
      return (
        <div className={cellClass} onClick={this.cellClicked} tabIndex="-1">
          {cellKind}
        </div>
      )
    }


  }
});

module.exports = Cell;
