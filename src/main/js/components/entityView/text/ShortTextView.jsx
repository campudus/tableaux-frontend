import React from "react";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import {hasUserAccessToLanguage} from "../../../helpers/accessManagementHelper";
import ActionCreator from "../../../actions/ActionCreator";
import i18n from "i18next";

class ShortTextView extends React.Component {

  constructor(props) {
    super(props);
    this.originalValue = this.getValue();
    this.state = {
      value: this.originalValue
    };
  };

  static propTypes = {
    langtag: React.PropTypes.string.isRequired,
    cell: React.PropTypes.object.isRequired,
    focusNextItem: React.PropTypes.func.isRequired,
    focusPreviousItem: React.PropTypes.func.isRequired
  };

  getValue = () => {
    const {cell, langtag} = this.props;
    const value = (cell.isMultiLanguage)
      ? cell.value[langtag]
      : cell.value;
    return value || "";
  };

  getKeyboardShortcuts = () => {
    const captureEventAnd = fn => event => {
      event.stopPropagation();
      event.preventDefault();
      (fn || function () {
      })();
    };

    return {
      escape: captureEventAnd(() => {}),
      enter: captureEventAnd(this.saveEditsAndClose),
      tab: event => {
        event.preventDefault();
        event.stopPropagation();
        ((event.shiftKey)
          ? this.props.focusPreviousItem
          : this.props.focusNextItem)();
      }
    };
  };

  saveEditsAndClose = () => {
    const {value} = this.state;
    if (value.trim() === this.originalValue) {
      return;
    }
    this.originalValue = value.trim();
    const {cell, langtag} = this.props;
    ActionCreator.changeCell(cell, (cell.isMultiLanguage? {[langtag]: value} : value))
  };

  render() {
    const {langtag} = this.props;
    return <div className="item-content">
      <input type="text" value={this.state.value}
             placeholder={i18n.t("table:empty.text")}
             disabled={!hasUserAccessToLanguage(langtag)}
             onChange={event => this.setState({value: event.target.value})}
             onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
             onBlur={this.saveEditsAndClose}
      />
    </div>
  }
}

export default ShortTextView;
