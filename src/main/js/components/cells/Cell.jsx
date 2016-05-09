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

import KeyboardShortcutsHelper from '../../helpers/KeyboardShortcutsHelper';


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
        cellKind = <ShortTextCell cell={this.props.cell} langtag={this.props.langtag} editing={this.props.editing}
                                  setCellKeyboardShortcuts={this.setKeyboardShortcutsForChildren}/>;
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
        <div className={cellClass} onClick={this.cellClicked} onContextMenu={this.rightClicked}
             tabIndex="-1" onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
             onMouseDown={this.onMouseDownHandler}>
          {cellKind}
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
