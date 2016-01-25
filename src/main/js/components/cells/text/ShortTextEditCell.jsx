var React = require('react');
var OutsideClick = require('react-onclickoutside');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var TextArea = require('./TextArea.jsx');
var KeyboardShortcutsMixin = require('../../mixins/KeyboardShortcutsMixin');

var ShortTextEditCell = React.createClass({

  mixins : [KeyboardShortcutsMixin, OutsideClick],

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    onBlur : React.PropTypes.func.isRequired
  },

  componentDidMount : function () {
    // Sets cursor to end of input field
    var node = this.refs.input;
    node.value = node.value;
  },

  componentWillMount : function () {
    this.inputName = 'cell-' + this.props.cell.tableId + '-' + this.props.cell.column.getId() + '-' + this.props.cell.rowId;
  },

  getKeyboardShortcuts : function (event) {
    var self = this;
    return {
      tab : function (event) {
        self.doneEditing(event);
        Dispatcher.trigger('selectNextCell', 'right');
      },
      enter : function (event) {
        //stop handling the Table events
        event.stopPropagation();
        self.doneEditing(event);
        //An event just for ShortTextEditCell to create a new Row when last is editing
        Dispatcher.trigger('createRowOrSelectNext');
      }
    };
  },

  handleClickOutside : function (event) {
    this.doneEditing(event);
  },

  doneEditing : function (event) {
    console.log("TextEditCell.doneEditing, event: ", event);
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.props.onBlur(this.refs.input.value);
  },

  getValue : function () {
    var cell = this.props.cell;

    var value = null;
    if (cell.isMultiLanguage) {
      if (cell.value[this.props.langtag]) {
        value = cell.value[this.props.langtag];
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
    return (
      <div className={'cell-content editing'} onKeyDown={this.onKeyboardShortcut}>
        <input autoFocus type="text" className="input" name={this.inputName} defaultValue={this.getValue()}
               ref="input"></input>
      </div>
    );
  }
});

module.exports = ShortTextEditCell;
