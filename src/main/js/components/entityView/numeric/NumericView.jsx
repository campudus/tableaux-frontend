import React from "react";

@listensToClickOutside
class NumericView extends React.Component {

  displayName: "NumericView",

  propTypes: {
    langtag: React.PropTypes.string.isRequired,
    cell: React.PropTypes.object.isRequired
  },

  getValue: function () {
    var cell = this.props.cell;

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
      (fn || function(){})();
    };

    return {
      escape: captureEventAnd(this.setEditing(false)),
      enter: captureEventAnd(this.saveEditsAndClose)
    }
  };

  render: function () {
    var value = this.getValue();

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
    )
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
