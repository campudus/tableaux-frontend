var React = require('react');
var ReactDOM = require('react-dom');
var AmpersandMixin = require('ampersand-react-mixin');

var TextCell = require('./text/TextCell.jsx');
var ShortTextCell = require('./text/ShortTextCell.jsx');
var NumericCell = require('./numeric/NumericCell.jsx');
var LinkCell = require('./link/LinkCell.jsx');
var AttachmentCell = require('./attachment/AttachmentCell.jsx');
var BooleanCell = require('./boolean/BooleanCell.jsx');
var DateTimeCell = require('./datetime/DateTimeCell.jsx');
var IdentifierCell = require('./identifier/IdentifierCell.jsx');
var Dispatcher = require('../../dispatcher/Dispatcher');
var KeyboardShortcutsMixin = require('../mixins/KeyboardShortcutsMixin');

var Cell = React.createClass({
  mixins : [AmpersandMixin, KeyboardShortcutsMixin],

  displayName : "Cell",

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    selected : React.PropTypes.bool,
    editing : React.PropTypes.bool,
    shouldFocus : React.PropTypes.bool
  },

  getInitialState : function () {
    return {
      keyboardShortcuts : {}
    };
  },

  componentDidMount : function () {
    this.checkFocus();
  },

  componentDidUpdate : function () {
    this.checkFocus();
  },

  getKeyboardShortcuts : function (event) {
    console.log("Cell.getKeyboardShortcuts()");
    return this.state.keyboardShortcuts;
  },

  setKeyboardShortcutsForChildren : function (childrenEvents) {
    this.setState({
      keyboardShortcuts : childrenEvents
    });
  },

  checkFocus : function () {
    if (this.props.selected && !this.props.editing && this.props.shouldFocus) {
      var thisDOMNode = ReactDOM.findDOMNode(this);
      //Is current focus inside of cell don't change the focus. This way child components can force their focus. (e.g. Links Component)
      if (!thisDOMNode.contains(document.activeElement)) {
        console.log("Cell will force focus");
        thisDOMNode.focus();
      }
    }
  },

  cellClicked : function (e) {
    console.log("cell clicked: ", this.props.cell);

    if (this.props.selected === true) {
      Dispatcher.trigger('toggleCellEditing', {
        cell : this.props.cell
      });

    } else {
      Dispatcher.trigger('toggleCellSelection', {
        cell : this.props.cell,
        selected : this.props.selected,
        langtag : this.props.langtag
      });
    }

    /*
     Important to block the click listener of Table. This helps focusing the cell when clicked but prevents from scrolling
     the table view when clicking on an element other than the cell.
     */
    e.stopPropagation();
    if (!this.props.shouldFocus) {
      Dispatcher.trigger('enableShouldCellFocus');
    }

  },

  render : function () {
    var cellKind = null;
    var cell = this.props.cell;

    switch (this.props.cell.kind) {

      //todo: switch language to langtag!!! Important LANGTAG
      case "link":
        cellKind = <LinkCell cell={this.props.cell} langtag={this.props.langtag} selected={this.props.selected}
                             editing={this.props.editing}
                             setCellKeyboardShortcuts={this.setKeyboardShortcutsForChildren}/>;
        break;

      case "attachment":
        cellKind = <AttachmentCell cell={this.props.cell} langtag={this.props.langtag}/>;
        break;

      case "numeric":
        cellKind = <NumericCell cell={this.props.cell} langtag={this.props.langtag} editing={this.props.editing}/>;
        break;

      case "boolean":
        cellKind = <BooleanCell cell={this.props.cell} langtag={this.props.langtag} selected={this.props.selected}
                                setCellKeyboardShortcuts={this.setKeyboardShortcutsForChildren}/>;
        break;

      case "datetime":
        cellKind = <DateTimeCell cell={this.props.cell} langtag={this.props.langtag} editing={this.props.editing}/>;
        break;

      case "shorttext":
        cellKind = <ShortTextCell cell={this.props.cell} langtag={this.props.langtag} editing={this.props.editing}/>;
        break;

      case "concat":
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
        <div className={cellClass} onClick={this.cellClicked} tabIndex="-1" onKeyDown={this.onKeyboardShortcut}>
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
