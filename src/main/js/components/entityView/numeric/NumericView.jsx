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

  handleClickOutside = event => {
    console.log("click outside")
    this.saveEditsAndClose();
  };

  setEditing = editing => () => {
    if (editing) {
      this.setState({value: this.getValue()});
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

  renderEditor = () => {
    return (
      <input type="number" className="input view-content" value={this.state.value}
             autoFocus
             onChange={event => this.setState({value: event.target.value})}
             onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
      />
    )
  };

  render() {
    const value = this.getValue();
    const {editing} = this.state;

    return (editing)
      ? this.renderEditor()
      : (
        <div className="view-content shorttext ignore-react-onclickoutside"
             onClick={this.setEditing(true)}
        >
          {value}
        </div>
      );
  }
}

export default NumericView;
