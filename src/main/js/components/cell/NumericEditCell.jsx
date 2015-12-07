var React = require('react');
var OutsideClick = require('react-onclickoutside');

var Dispatcher = require('../../dispatcher/Dispatcher');
var KeyboardShortcutsMixin = require('../mixins/KeyboardShortcutsMixin');

var NumericEditCell = React.createClass({

  mixins : [KeyboardShortcutsMixin, OutsideClick],

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    language : React.PropTypes.string.isRequired,
    onSave : React.PropTypes.func.isRequired
  },

  getKeyboardShortcuts : function () {
    return {
      "enter" : this.onSave
    };
  },

  handleClickOutside : function (event) {
    this.onSave(event);
  },

  /**
   * Returns a clean Number and displays the correct value to the input field
   * @param input
   * @returns {float|null} result
   */
  formatNumberCell : function (input) {
    var result = null;
    var curr = input.value;
    if (curr.trim().length !== 0) {
      var formattedNumber = curr.replace(/,/g, ".");
      var realNumber = parseFloat(formattedNumber);
      if (!isNaN(realNumber)) {
        result = realNumber;
      }
    }
    input.value = (result === null) ? "" : result;
    return result;
  },

  onSave : function (event) {
    event.preventDefault();
    this.props.onSave(this.formatNumberCell(this.refs.input));
  },

  componentDidMount : function () {
    var node = this.refs.input;
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
