import React from "react";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";

class ShortTextView extends React.Component {

  constructor(props) {
    super(props);
    this.displayName = "ShortTextView";
    this.state = {editing: false};
  };

  static propTypes = {
    langtag: React.PropTypes.string.isRequired,
    cell: React.PropTypes.object.isRequired
  };

  getValue =  () => {
    const {cell, langtag} = this.props;
    const value = (cell.isMultiLanguage)
      ? cell.value[langtag]
      : cell.value;
    return value || "";
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

  saveEditsAndClose = () => {
    const {value} = this.state;
    const {cell, langtag} = this.props;
    const changes = (cell.isMultiLanguage)
      ? {value: {[langtag]: value}}
      : {value};
    cell.save(changes, {isPatch: true});
    this.setEditing(false)();
  };

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

  render() {
    const value = this.getValue();
    const {editing} = this.state;

    return (editing)
      ? this.renderEditor()
      : (
        <div className="view-content view-shorttext"
             onClick={this.setEditing(true)}
        >
          {value}
        </div>
      );
  }
}

export default ShortTextView;
