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
        console.log("enter shortTextEdit");
        //stop handling the Table events
        event.stopPropagation();
        self.doneEditing(event);
        Dispatcher.trigger('selectNextCell', 'down');
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


  componentDidMount : function () {
    /*
     * important: last parameter 'useCapture' must be true. This starts event handling at the beginning and allows to
     * stop propagation to the table key listener
     */
    document.addEventListener('keydown', this.onKeyboardShortcut, true);
    var node = this.refs.input;
    node.focus();
    // Sets cursor to end of input field
    node.value = node.value;
  },

  componentWillMount : function () {
    //FIXME: Better in static variable ?
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
    return (
        <div className={'cell-content editing'}>
          <input type="text" className="input" name={this.inputName} defaultValue={this.getValue()}
                 ref="input"></input>
        </div>
    );
  }
});

module.exports = TextEditCell;
