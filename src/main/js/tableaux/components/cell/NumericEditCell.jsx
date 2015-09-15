var React = require('react');
var OutsideClick = require('react-onclickoutside');

var Dispatcher = require('../../Dispatcher');
var KeyboardShortcutsMixin = require('../mixins/KeyboardShortcutsMixin');

var NumericEditCell = React.createClass({

  mixins : [KeyboardShortcutsMixin, OutsideClick],

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    language : React.PropTypes.string.isRequired,
    onSave : React.PropTypes.func.isRequired
  },

  getKeyboardShortcuts : function () {
    var arr = [];
    // enter = 13
    arr[13] = this.onSave;
    return arr;
  },

  handleClickOutside : function (event) {
    this.onSave(event);
  },

  onSave : function (event) {
    console.log("NumericEditCell.onSave");

    event.preventDefault();

    this.props.onSave(this.refs.input.getDOMNode().value);
  },

  componentDidMount : function () {
    var node = this.refs.input.getDOMNode();
    node.focus();
    // Sets cursor to end of input field
    node.value = node.value;
  },

  componentWillMount : function () {
    // TODO Move this into a mixin
    this.inputName = 'cell-' + this.props.cell.tableId + '-' + this.props.cell.column.getId() + '-' + this.props.cell.rowId;
  },

  getValue : function () {
    var cell = this.props.cell;

    var value = null;
    if (cell.isMultiLanguage) {
      if (cell.value[this.props.language]) {
        value = cell.value[this.props.language];
      } else {
        // in this case we don't
        // have a value for this language
        value = "";
      }
    } else {
      value = cell.value || "";
    }

    return value;
  },

  render : function () {
    var self = this;

    var cell = this.props.cell;

    return (
      <div className={'cell editing cell-' + cell.column.getId() + '-' + cell.rowId}>
        <input type="number" className="input" name={this.inputName} defaultValue={this.getValue()}
               onKeyDown={this.onKeyboardShortcut}
               ref="input"/>
      </div>
    );
  }
});

module.exports = NumericEditCell;
