var React = require('react');
var KeyboardShortcutsMixin = require('./../mixins/KeyboardShortcutsMixin');

var EditLabelCell = React.createClass({

  mixins : [KeyboardShortcutsMixin],

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    language : React.PropTypes.string.isRequired,
    onBlur : React.PropTypes.func.isRequired
  },

  getKeyboardShortcuts : function () {
    var arr = [];
    // enter = 13
    arr[13] = this.doneEditing;
    return arr;
  },

  doneEditing : function (event) {
    console.log("EditLabelCell.doneEditing()", arguments);
    event.preventDefault();

    this.props.onBlur(this.refs.input.getDOMNode().value);
  },

  componentDidMount : function () {
    var node = this.refs.input.getDOMNode();
    node.focus();
    // Sets cursor to end of input field
    node.value = node.value;
  },

  componentWillMount : function () {
    this.inputName = 'cell-' + this.props.cell.tableId + '-' + this.props.cell.column.getId() + '-' + this.props.cell.rowId;
  },

  render : function () {
    var inputType = 'text';
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

    var multiline = false;
    if (value.indexOf('\n') > -1 || value.length > 100) {
      multiline = true;
    }

    if (multiline) {
      return (
        <div className={'cell editing cell-' + cell.column.getId() + '-' + cell.rowId}>
          <textarea className="input" name={this.inputName} onBlur={this.doneEditing} defaultValue={value}
                    ref="input"></textarea>
        </div>
      );
    } else {
      return (
        <div className={'cell editing cell-' + cell.column.getId() + '-' + cell.rowId}>
          <input className="input" type={inputType} name={this.inputName} defaultValue={value} onBlur={this.doneEditing}
                 onKeyDown={this.onKeyboardShortcut}
                 ref="input"/>
        </div>
      );
    }
  }
});

module.exports = EditLabelCell;
