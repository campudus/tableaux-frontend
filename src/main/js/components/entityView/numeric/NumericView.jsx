import React from "react";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import ActionCreator from "../../../actions/ActionCreator";
import * as f from "lodash/fp";
import i18n from "i18next";
import {contentChanged} from "../../cells/Cell";

class NumericView extends React.Component {

  constructor(props) {
    super(props);
    this.originalValue = parseFloat(this.getValue()) || 0;
    this.state = {
      value: this.originalValue,
      dirty: false
    };
  };

  static propTypes = {
    langtag: React.PropTypes.string.isRequired,
    cell: React.PropTypes.object.isRequired,
    thisUserCantEdit: React.PropTypes.bool
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
    this.setState({value: normalised, dirty: true});
  };

  handleKeyPress = event => {
    if (!this.isKeyAllowed(event)) {
      return;
    }
    KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)(event);
  };

  isKeyAllowed = event => {
    const numbers = f.map(f.toString, f.range(0, 10));
    const allowedKeys = [...numbers, ".", ",", "ArrowLeft", "ArrowRight", "Enter", "Return", "Escape", "Backspace", "Delete", "Tab", "ArrowUp", "ArrowDown"];
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
      enter: captureEventAnd(this.saveEdits)
    };
  };

  componentWillReceiveProps(np) {
    const {cell, langtag} = np;
    const nextVal = (cell.isMultiLanguage)
      ? cell.value[langtag]
      : cell.value;
    if ((!this.state.dirty && (parseFloat(nextVal) || 0) !== this.originalValue)
      || np.cell !== this.props.cell || langtag !== this.props.langtag
    ) {
      this.setState({value: nextVal, dirty: false});
    }
  }

  saveEdits = () => {
    const value = parseFloat(this.state.value);
    if (value === this.originalValue || !this.state.dirty) {
      return;
    }
    const {cell, langtag} = this.props;
    ActionCreator.changeCell(
      cell,
      ((cell.isMultiLanguage) ? {[langtag]: value} : value),
      contentChanged(cell, langtag, this.originalValue)
    );
    this.originalValue = value;
    this.setState({dirty: false});
  };

  componentWillUnmount() {
    this.saveEdits();
  }

  render() {
    const {funcs, thisUserCantEdit} = this.props;
    return (
      <div className="item-content numeric" >
        <input type="text" value={this.state.value || ""}
               disabled={thisUserCantEdit}
               onChange={this.normaliseNumberFormat}
               onKeyDown={this.handleKeyPress}
               onBlur={this.saveEdits}
               placeholder={i18n.t("table:empty.number")}
               ref={el => { funcs.register(el); }}
        />
        {this.props.children}
      </div>
    );
  }
}

export default NumericView;
