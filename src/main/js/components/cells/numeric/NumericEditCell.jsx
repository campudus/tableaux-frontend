var React = require('react');
var OutsideClick = require('react-onclickoutside');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var KeyboardShortcutsMixin = require('../../mixins/KeyboardShortcutsMixin');

var NumericEditCell = React.createClass({

  mixins : [KeyboardShortcutsMixin, OutsideClick],

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    onSave : React.PropTypes.func.isRequired
  },

  getKeyboardShortcuts : function () {
    var self = this;
    return {
      tab : function (event) {
        self.doneEditing(event);
        Dispatcher.trigger('selectNextCell', 'right');
      },
      enter : function (event) {
        console.log("numeric Enter");
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

  doneEditing : function (event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.props.onSave(this.formatNumberCell(this.refs.input));
  },

  componentDidMount : function () {
    /*
     * important: last parameter 'useCapture' must be true. This starts event handling at the beginning and allows to
     * stop propagation to the table key listener
     */
    document.addEventListener('keydown', this.onKeyboardShortcut, true);
    var node = this.refs.input;
    // Sets cursor to end of input field
    node.value = node.value;
  },

  componentWillMount : function () {
    // TODO Move this into a mixin
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

    var cell = this.props.cell;

    return (
      <div className={'cell-content editing'}>
        <input autoFocus type="number" className="input" name={this.inputName} defaultValue={this.getValue()}
               ref="input"/>
      </div>
    );
  }
});

module.exports = NumericEditCell;
