var React = require('react');
var OutsideClick = require('react-onclickoutside');
var _ = require('lodash');
var ActionCreator = require('../../../actions/ActionCreator');
var Directions = require('../../../constants/TableauxConstants').Directions;

var NumericEditCell = React.createClass({

  mixins : [OutsideClick],

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    onSave : React.PropTypes.func.isRequired,
    setCellKeyboardShortcuts : React.PropTypes.func
  },

  MAX_DIGIT_LENGTH : 15,

  componentDidMount : function () {
    this.props.setCellKeyboardShortcuts(this.getKeyboardShortcuts());
    var node = this.refs.input;
    // Sets cursor to end of input field
    node.value = node.value;
  },

  componentWillMount : function () {
    // TODO Move this into a mixin
    this.inputName = 'cell-' + this.props.cell.tableId + '-' + this.props.cell.column.getId() + '-' + this.props.cell.rowId;
  },

  componentWillUnmount : function () {
    this.props.setCellKeyboardShortcuts({});
  },

  getKeyboardShortcuts : function () {
    var self = this;
    return {
      up : function (event) {
        event.preventDefault();
        self.doneEditing(event);
      },
      down : function (event) {
        event.preventDefault();
        self.doneEditing(event);
      },
      left : function (event) {
        event.stopPropagation();
      },
      right : function (event) {
        event.stopPropagation();
      },
      enter : function (event) {
        self.doneEditing(event);
        ActionCreator.selectNextCell(Directions.DOWN);
      },
      navigation : function (event) {
        self.doneEditing(event);
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
    var currLength = curr.trim().length;

    if (currLength > this.MAX_DIGIT_LENGTH) {
      throw "MAX_DIGIT_LENGTH reached: " + this.MAX_DIGIT_LENGTH;
    }
    else if (currLength >= 0) {
      var formattedNumber = this.correctNumberFormat(curr);
      var realNumber = parseFloat(formattedNumber);
      if (!isNaN(realNumber)) {
        result = realNumber;
      }
    }
    input.value = (result === null) ? "" : result;
    return result;
  },

  doneEditing : function (event) {
    this.props.onSave(this.formatNumberCell(this.refs.input));
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

  correctNumberFormat : function (value) {
    return String(value).replace(/,/g, ".");
  },

  onChangeHandler : function (e) {
    var curr = e.target.value;
    var formattedNumber = this.correctNumberFormat(curr);

    if (formattedNumber.length > this.MAX_DIGIT_LENGTH) {
      alert("Numbers can't be greater than 15 decimal values.");
      e.target.value = formattedNumber.substring(0, this.MAX_DIGIT_LENGTH);
    }
  },

  render : function () {
    return (
      <div className={'cell-content editing'}>
        <input autoFocus type="number"
               className="input"
               name={this.inputName}
               defaultValue={this.getValue()}
               onChange={this.onChangeHandler} ref="input"/>
      </div>
    );
  }
});

module.exports = NumericEditCell;
