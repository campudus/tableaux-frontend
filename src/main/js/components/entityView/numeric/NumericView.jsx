import React from "react";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import listensToClickOutside from "react-onclickoutside";
import * as f from "lodash/fp";

@listensToClickOutside
class NumericView extends React.Component {

  constructor(props) {
    super(props);
    this.displayName = "NumericView";
    this.state = {editing: false};
    this.prevFocussed = null;
  };

  static propTypes = {
    langtag: React.PropTypes.string.isRequired,
    cell: React.PropTypes.object.isRequired
  };

  getValue = () => {
    const {cell, langtag} = this.props;

    const value = (cell.isMultiLanguage)
      ? cell.value[langtag]
      : cell.value;
    return value || "";
  };

  setEditing = editing => () => {
    if (editing) {
      this.setState({value: this.getValue()});
    } else if (this.prevFocussed) {
      this.prevFocussed.focus();
    }
    this.setState({editing});
  };

  handleKeyPress = event => {
    if (!this.isKeyAllowed(event)) {
      return;
    }
    KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)(event);
  };

  isKeyAllowed = event => {
    const numbers = f.map(f.toString, f.range(0, 10));
    const allowedKeys = [...numbers, ".", ",", "ArrowLeft", "ArrowRight", "Enter", "Return", "Escape", "Backspace", "Delete", "Tab"];
    if (!f.contains(event.key, allowedKeys)) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    return true;
  };

  getKeyboardShortcuts = () => {
    const captureEventAnd = fn => event => {
      event.stopPropagation();
      (fn || function () {})();
    };

    return {
      escape: captureEventAnd(this.setEditing(false)),
      enter: captureEventAnd(this.saveEditsAndClose)
    };
  };

  saveEditsAndClose = () => {
    const value = parseFloat(this.state.value);
    const {cell, langtag} = this.props;
    const changes = (cell.isMultiLanguage)
      ? {value: {[langtag]: value}}
      : {value};
    cell.save(changes, {patch: true});
    this.setEditing(false)();
  };

  handleClickOutside = event => {
    if (!this.state.editing) {
      return;
    }
    this.saveEditsAndClose();
  };

  renderEditor = () => {
    return (
      <input type="text" className="input view-content view-numeric ignore-react-onclickoutside" value={this.state.value}
             autoFocus
             onChange={this.normaliseNumberFormat}
             onKeyDown={this.handleKeyPress}
      />
    );
  };

  editOnEnter = event => {
    if (event.key === "Enter") {
      event.stopPropagation();
      event.preventDefault();
      this.prevFocussed = document.activeElement;
      this.setEditing(true)();
    }
  };

  normaliseNumberFormat = event => {
    const inputString = event.target.value.replace(/,/g, ".");
    const normalised = (inputString.split(".").length > 2)
      ? inputString.substr(0, inputString.length - 1)
      : inputString;
    this.setState({value: normalised});
  };

  render() {
    const value = this.getValue();
    const {editing} = this.state;

    return (editing)
      ? this.renderEditor()
      : (
        <div className="view-content view-numeric"
             onClick={this.setEditing(true)}
             tabIndex={this.props.tabIdx}
             onKeyDown={this.editOnEnter}
        >
          {value}
        </div>
      );
  }
}

export default NumericView;
