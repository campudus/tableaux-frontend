var React = require('react');
var OutsideClick = require('react-onclickoutside');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var TextArea = require('./TextArea.jsx');
var KeyboardShortcutsMixin = require('../../mixins/KeyboardShortcutsMixin');

var TextEditCell = React.createClass({

  mixins : [KeyboardShortcutsMixin, OutsideClick],

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    onBlur : React.PropTypes.func.isRequired
  },

  getKeyboardShortcuts : function (event) {
    var self = this;
    return {
      tab : function (event) {
        self.doneEditing(event);
        Dispatcher.trigger('selectNextCell', 'right');
      },
      enter : function (event) {
        console.log("enter texteditcell");
        //stop handling the Table events
        event.stopPropagation();
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

  openOverlay : function (event) {
    console.log("TextEditCell.openOverlay");

    this.doneEditing(event);

    var self = this;

    Dispatcher.trigger("openGenericOverlay", {
      head : this.props.cell.column.name,
      body : <TextArea initialContent={this.getValue()} onClose={self.closeOverlay} onSave={self.saveOverlay}/>
    }, "normal", self.props.cell, this.props.langtag);
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
    /*
     * important: last parameter 'useCapture' must be true. This starts event handling at the beginning and allows to
     * stop propagation to the table key listener
     */
    document.addEventListener('keydown', this.onKeyboardShortcut, true);
    var node = this.refs.input;
    node.focus();
    var text = node.value;
    // Sets cursor to end of input field
    node.value = ""; //textarea must be empty first to jump to end of text
    node.value = text;
  },

  componentWillMount : function () {
    this.inputName = 'cell-' + this.props.cell.tableId + '-' + this.props.cell.column.getId() + '-' + this.props.cell.rowId;
  },

  componentWillUnmount : function () {

    //parameter useCapture must be true or added listener doesn't get removed
    document.removeEventListener('keydown', this.onKeyboardShortcut, true);
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
    var self = this;

    return (
        <div className={'cell-content editing'}>
        <textarea className="input" name={this.inputName} defaultValue={this.getValue()}
                  ref="input" rows="4"></textarea>
          <button className="add" onClick={self.openOverlay}><span className="fa fa-expand"></span></button>
        </div>
    );
  }
});

module.exports = TextEditCell;
