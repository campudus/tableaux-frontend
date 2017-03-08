import React from "react";

class ShortTextView extends React.Component {

  displayName: "DateTimeView",

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

  getKeyboardShortcuts = () => {
    const captureEventAnd = fn => event => {
      event.stopPropagation();
      event.preventDefault();
      (fn || function(){})();
    };

    return {
      escape: captureEventAnd(this.setEditing(false)),
      enter: captureEventAnd(this.saveEditsAndClose)
    }
  };

  render: function () {
    var value = this.getValue();

  renderEditor = () => {
    return (
      <input type="text" className="input view-content view-shorttext" value={this.state.value}
             autoFocus
             onChange={event => this.setState({value: event.target.value})}
             onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
             onBlur={this.saveEditsAndClose}
      />
    )
  };

  openOnEnter = event => {
    if (event.key === "Enter") {
      event.stopPropagation();
      event.preventDefault();
      this.prevFocussed = document.activeElement;
      this.setEditing(true)();
    }
  };

  render() {
    const value = this.getValue();
    const {editing} = this.state;

    return (editing)
      ? this.renderEditor()
      : (
        <div className="view-content view-shorttext"
             onClick={this.setEditing(true)}
             tabIndex={this.props.tabIdx}
             onKeyDown={this.openOnEnter}
          >
          {value}
        </div>
      );
  }
}

export default ShortTextView;
