var React = require('react');
var OutsideClick = require('react-onclickoutside');

var Dispatcher = require('../../Dispatcher');
var KeyboardShortcutsMixin = require('../mixins/KeyboardShortcutsMixin');

var TextArea = require('../TextArea.jsx');

var TextEditCell = React.createClass({

  mixins : [KeyboardShortcutsMixin, OutsideClick],

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

  handleClickOutside : function (event) {
    this.doneEditing(event);
  },

  doneEditing : function (event) {
    console.log("TextEditCell.doneEditing");

    event.preventDefault();

    this.props.onBlur(this.refs.input.getDOMNode().value);
  },

  openOverlay : function (event) {
    console.log("TextEditCell.openOverlay");

    this.doneEditing(event);

    var self = this;

    Dispatcher.trigger("openGenericOverlay", {
      head : this.props.cell.column.name,
      body : <TextArea initialContent={this.getValue()} onClose={self.closeOverlay} onSave={self.saveOverlay}/>
    });
  },

  closeOverlay : function (event) {
    console.log("TextEditCell.closeOverlay");

    Dispatcher.trigger("closeGenericOverlay");
  },

  saveOverlay : function (content, event) {
    console.log("TextEditCell.saveOverlay");

    this.closeOverlay(event);

    this.props.onBlur(content);
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
        <textarea className="input" name={this.inputName} defaultValue={this.getValue()}
                  onKeyDown={this.onKeyboardShortcut}
                  ref="input" rows="1"></textarea>
        <button className="add" onClick={self.openOverlay}><span className="fa fa-expand"></span></button>
      </div>
    );
  }
});

module.exports = TextEditCell;
