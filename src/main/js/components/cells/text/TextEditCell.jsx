var React = require('react');
var OutsideClick = require('react-onclickoutside');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var TextArea = require('./TextArea.jsx');
var KeyboardShortcutsMixin = require('../../mixins/KeyboardShortcutsMixin');
var ExpandButton = require('./ExpandButton.jsx');

var TextEditCell = React.createClass({

  mixins : [KeyboardShortcutsMixin, OutsideClick],

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    onBlur : React.PropTypes.func.isRequired,
    defaultText : React.PropTypes.string.isRequired,
    openOverlay : React.PropTypes.func.isRequired,
    closeOverlay : React.PropTypes.func.isRequired,
    saveOverlay : React.PropTypes.func.isRequired
  },

  getInputName : function () {
    return this.inputName = 'cell-' + this.props.cell.tableId + '-' + this.props.cell.column.getId() + '-' + this.props.cell.rowId;
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
    //pass possible new text in editmode to overlay
    this.props.openOverlay(event, this.refs.input.value);
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

  componentWillUnmount : function () {
    //parameter useCapture must be true or added listener doesn't get removed
    document.removeEventListener('keydown', this.onKeyboardShortcut, true);
  },

  render : function () {
    return (
        <div className={'cell-content editing'}>
        <textarea className="input" name={this.getInputName()} defaultValue={this.props.defaultText}
                  ref="input" rows="4"></textarea>
          <ExpandButton onTrigger={this.openOverlay}/>
        </div>
    );
  }
});

module.exports = TextEditCell;
