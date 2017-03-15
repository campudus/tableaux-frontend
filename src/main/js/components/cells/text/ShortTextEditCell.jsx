var React = require("react");
var Dispatcher = require("../../../dispatcher/Dispatcher");
var TextArea = require("./TextArea.jsx");
var ActionCreator = require("../../../actions/ActionCreator");

import listensToClickOutside from "react-onclickoutside";

@listensToClickOutside
class ShortTextEditCell extends React.Component {

  componentDidMount = () => {
    this.props.setCellKeyboardShortcuts(this.getKeyboardShortcuts());
    // Sets cursor to end of input field
    var node = this.refs.input;
    node.value = node.value;
  };

  componentWillMount = () => {
    this.inputName = "cell-" + this.props.cell.tableId + "-" + this.props.cell.column.getId() + "-" + this.props.cell.rowId;
  };

  componentWillUnmount = () => {
    this.props.setCellKeyboardShortcuts({});
  };

  getKeyboardShortcuts = (event) => {
    var self = this;
    return {
      // allow left arrow key inside input
      left: function (event) {
        event.stopPropagation();
      },
      // allow left arrow key inside input
      right: function (event) {
        event.stopPropagation();
      },
      enter: function (event) {
        // stop handling the Table events
        event.stopPropagation();
        self.doneEditing(event);
        // An event just for ShortTextEditCell to create a new Row when last is editing
        ActionCreator.addRowOrSelectNextCell();
      },
      navigation: function (event) {
        self.doneEditing(event);
      }
    };
  };

  handleClickOutside = (event) => {
    this.doneEditing(event);
  };

  doneEditing = (event) => {
    this.props.onBlur(this.refs.input.value);
  };

  getValue = () => {
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
  };

  render = () => {
    return (
      <div className={"cell-content editing"} onKeyDown={this.onKeyboardShortcut}>
        <input autoFocus type="text" className="input" name={this.inputName} defaultValue={this.getValue()}
               ref="input"></input>
      </div>
    );
  };
}
;

ShortTextEditCell.propTypes = {
  cell: React.PropTypes.object.isRequired,
  langtag: React.PropTypes.string.isRequired,
  onBlur: React.PropTypes.func.isRequired,
  setCellKeyboardShortcuts: React.PropTypes.func
};

module.exports = ShortTextEditCell;
