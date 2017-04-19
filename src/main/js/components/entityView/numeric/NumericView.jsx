import React from "react";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import {hasUserAccessToLanguage} from "../../../helpers/accessManagementHelper";
import ActionCreator from "../../../actions/ActionCreator";
import * as f from "lodash/fp";

class NumericView extends React.Component {

  constructor(props) {
    super(props);
    this.originalValue = parseFloat(this.getValue()) || 0;
    this.state = {
      value: this.originalValue
    };
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
    return value || 0;
  };

  normaliseNumberFormat = event => {
    const inputString = event.target.value.replace(/,/g, ".");
    const normalised = (inputString.split(".").length > 2)
      ? inputString.substr(0, inputString.length - 1)
      : inputString;
    this.setState({value: normalised});
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
      escape: captureEventAnd(() => {}),
      enter: captureEventAnd(this.saveEditsAndClose)
    };
  };

  saveEditsAndClose = () => {
    const value = parseFloat(this.state.value);
    if (value === this.originalValue) {
      return;
    }
    this.originalValue = value;
    const {cell, langtag} = this.props;
    ActionCreator.changeCell(cell, (cell.isMultiLanguage? {[langtag]: value} : value))
  };

  render() {
    const {langtag, funcs} = this.props;
    return <div className="item-content">
      <input type="text" value={this.state.value}
             disabled={!hasUserAccessToLanguage(langtag)}
             onChange={this.normaliseNumberFormat}
             onKeyDown={this.handleKeyPress}
             onBlur={this.saveEditsAndClose}
             placeholder={0}
             ref={el => { funcs.register(el) }}
      />
    </div>
  }
}

export default NumericView;
