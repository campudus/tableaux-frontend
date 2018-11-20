import ActionCreator from "../../../actions/ActionCreator";
import React from "react";
import listensToClickOutside from "react-onclickoutside";
import {maybe} from "../../../helpers/functools";
import PropTypes from "prop-types";

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
    this.props.onBlur(this.input.value);
  };

  getValue = () => {
    const {cell, langtag} = this.props;
    const value = (cell.isMultiLanguage)
      ? cell.value[langtag]
      : cell.value;

    return value || "";
  };

  setCaret = () => {
    const l = this.getValue().length;
    maybe(this.input).method("setSelectionRange", l, l);
  };

  render() {
    return (
      <div className={"cell-content editing"} onKeyDown={this.onKeyboardShortcut}>
        <input autoFocus type="text" className="input" name={this.inputName} defaultValue={this.getValue()}
          ref={ el => { this.input = el; this.setCaret(); }}
        />
      </div>
    );
  };
}

ShortTextEditCell.propTypes = {
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  onBlur: PropTypes.func.isRequired,
  setCellKeyboardShortcuts: PropTypes.func
};

export default ShortTextEditCell;
