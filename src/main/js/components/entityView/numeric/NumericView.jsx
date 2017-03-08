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
    this.focusTarget.focus();
  };

  renderEditor = () => {
    return (
      <input type="number" className="input view-content view-numeric ignore-react-onclickoutside" value={this.state.value}
             autoFocus
             onChange={event => this.setState({value: event.target.value})}
             onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
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
             ref={el => this.focusTarget = el}
        >
          {value}
        </div>
      );
  }
}

export default NumericView;
