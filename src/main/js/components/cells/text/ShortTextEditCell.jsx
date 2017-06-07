import ActionCreator from "../../../actions/ActionCreator";
import React from "react";
import listensToClickOutside from "react-onclickoutside";

@listensToClickOutside
class ShortTextEditCell extends React.Component {

  componentDidMount = () => {
    this.props.setCellKeyboardShortcuts(this.getKeyboardShortcuts());
  };

  componentWillMount = () => {
    this.inputName = "cell-" + this.props.cell.tableId + "-" + this.props.cell.column.getId() + "-" + this.props.cell.rowId;
  };

  componentWillUnmount = () => {
    this.props.setCellKeyboardShortcuts({});
  };

  getKeyboardShortcuts = (event) => {
    const self = this;
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
    const {cell, langtag} = this.props;
    const value = (cell.isMultiLanguage)
      ? cell.value[langtag]
      : cell.value;

    return value || "";
  };

  setCaret = () => {
    const value = this.getValue();
    const l = value.length;
    this.refs.input.setSelectionRange(l, l);
  };

  render = () => {
    return (
      <div className={"cell-content editing"} onKeyDown={this.onKeyboardShortcut}>
        <input autoFocus type="text" className="input" name={this.inputName} defaultValue={this.getValue()}
               onFocus={this.setCaret}
               ref="input" />
      </div>
    );
  };
}

ShortTextEditCell.propTypes = {
  cell: React.PropTypes.object.isRequired,
  langtag: React.PropTypes.string.isRequired,
  onBlur: React.PropTypes.func.isRequired,
  setCellKeyboardShortcuts: React.PropTypes.func
};

export default ShortTextEditCell;
