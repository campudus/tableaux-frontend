var React = require("react");
var _ = require("lodash");
var ActionCreator = require("../../../actions/ActionCreator");
var Directions = require("../../../constants/TableauxConstants").Directions;
import listensToClickOutside from "react-onclickoutside";

@listensToClickOutside
class NumericEditCell extends React.Component {

  constructor(props) {
    super(props);
    this.MAX_DIGIT_LENGTH = 15;
  }

  componentDidMount = () => {
    this.props.setCellKeyboardShortcuts(this.getKeyboardShortcuts());
    var node = this.refs.input;
    // Sets cursor to end of input field
    node.value = node.value;
  };

  componentWillMount = () => {
    // TODO Move this into a mixin
    this.inputName = "cell-" + this.props.cell.tableId + "-" + this.props.cell.column.getId() + "-" + this.props.cell.rowId;
  };

  componentWillUnmount = () => {
    this.props.setCellKeyboardShortcuts({});
  };

  getKeyboardShortcuts = () => {
    var self = this;
    return {
      up: function (event) {
        event.preventDefault();
        self.doneEditing(event);
      },
      down: function (event) {
        event.preventDefault();
        self.doneEditing(event);
      },
      left: function (event) {
        event.stopPropagation();
      },
      right: function (event) {
        event.stopPropagation();
      },
      enter: function (event) {
        self.doneEditing(event);
        ActionCreator.selectNextCell(Directions.DOWN);
      },
      navigation: function (event) {
        self.doneEditing(event);
      }
    };
  };

  handleClickOutside = (event) => {
    this.doneEditing(event);
  };

  /**
   * Returns a clean Number and displays the correct value to the input field
   * @param input
   * @returns {float|null} result
   */
  formatNumberCell = (input) => {
    var result = null;
    var curr = input.value;
    var currLength = curr.trim().length;

    if (currLength > this.MAX_DIGIT_LENGTH) {
      throw "MAX_DIGIT_LENGTH reached: " + this.MAX_DIGIT_LENGTH;
    } else if (currLength >= 0) {
      var formattedNumber = this.correctNumberFormat(curr);
      var realNumber = parseFloat(formattedNumber);
      if (!isNaN(realNumber)) {
        result = realNumber;
      }
    }
    input.value = (result === null) ? "" : result;
    return result;
  }

  doneEditing = (event) => {
    this.props.onSave(this.formatNumberCell(this.refs.input));
  }

  getValue = () => {
    var cell = this.props.cell;

    var value = null;
    if (cell.isMultiLanguage) {
      var multiLangValue = cell.value[this.props.langtag];
      // allow zero as value
      if (multiLangValue === 0) {
        value = multiLangValue;
      } else if (multiLangValue) {
        value = cell.value[this.props.langtag];
      } else {
        // in this case we don't
        // have a value for this language
        value = "";
      }
    } else {
      // allow zero as value
      if (cell.value === 0) {
        value = cell.value;
      } else {
        value = cell.value || "";
      }
    }

    return value;
  }

  correctNumberFormat = (value) => {
    return String(value).replace(/,/g, ".");
  }

  onChangeHandler = (e) => {
    var curr = e.target.value;
    var formattedNumber = this.correctNumberFormat(curr);

    if (formattedNumber.length > this.MAX_DIGIT_LENGTH) {
      alert("Numbers can't be greater than 15 decimal values.");
      e.target.value = formattedNumber.substring(0, this.MAX_DIGIT_LENGTH);
    }
  };

  render = () => {
    return (
      <div className={"cell-content editing"}>
        <input autoFocus type="number"
               className="input"
               name={this.inputName}
               defaultValue={this.getValue()}
               onChange={this.onChangeHandler} ref="input"/>
      </div>
    );
  }
};

NumericEditCell.propTypes = {
  cell: React.PropTypes.object.isRequired,
  langtag: React.PropTypes.string.isRequired,
  onSave: React.PropTypes.func.isRequired,
  setCellKeyboardShortcuts: React.PropTypes.func
};

module.exports = NumericEditCell;
