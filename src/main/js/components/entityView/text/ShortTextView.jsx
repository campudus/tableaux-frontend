import React from "react";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import ActionCreator from "../../../actions/ActionCreator";
import i18n from "i18next";
import * as f from "lodash/fp";

import {contentChanged} from "../../cells/Cell";

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
    thisUserCantEdit: React.PropTypes.bool
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
      })(event);
    };

    return {
//      escape: captureEventAnd(() => { this.background.focus() }),
      escape: captureEventAnd(this.saveEditsAndClose),
      enter: captureEventAnd(this.saveEditsAndClose)
    };
  };

  saveEditsAndClose = () => {
    const {value} = this.state;
    if (f.isNil(value) || value.trim() === this.originalValue) {
      return;
    }
    const {cell, langtag} = this.props;
    ActionCreator.changeCell(
      cell,
      ((cell.isMultiLanguage) ? {[langtag]: value} : value),
      () => contentChanged(cell, langtag, this.originalValue)
    );
    this.originalValue = value.trim();
  };

  componentWillReceiveProps(np) {
    const {cell, langtag} = np;
    const nextVal = f.defaultTo("")(
      (cell.isMultiLanguage)
        ? cell.value[langtag]
        : cell.value
    );
    if (nextVal !== this.originalValue) {
      this.setState({value: nextVal});
    }
  }

  render() {
    const {funcs, thisUserCantEdit} = this.props;
    return (
      <div className="item-content shorttext" ref={el => { this.background = el; }} tabIndex={1}>
        <input type="text" value={this.state.value || ""}
               placeholder={i18n.t("table:empty.text")}
               disabled={thisUserCantEdit}
               onChange={event => { this.setState({value: event.target.value}); }}
               onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
               onBlur={this.saveEditsAndClose}
               ref={el => { funcs.register(el); }}
        />
        {this.props.children}
      </div>
    );
  }
}

export default ShortTextView;
