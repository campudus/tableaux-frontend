import React from "react";
import KeyboardShortcutsHelper from "../helpers/KeyboardShortcutsHelper";
import ActionCreator from "../actions/ActionCreator";
import i18n from "i18next";
import * as f from "lodash/fp";

import {contentChanged} from "./cells/Cell";

class PoorTextComponent extends React.Component {

  constructor(props) {
    super(props);
    this.originalValue = this.getValue().trim();
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
      escape: captureEventAnd(this.saveEdits),
      enter: captureEventAnd(this.saveEdits)
    };
  };

  saveEdits = () => {
    const {dirty, value} = this.state;
    if (!dirty || f.isNil(value) || value.trim() === this.originalValue) {
      return;
    }
    const {cell, langtag} = this.props;
    ActionCreator.changeCell(
      cell,
      ((cell.isMultiLanguage) ? {[langtag]: value} : value),
      () => contentChanged(cell, langtag, this.originalValue)
    );
    this.originalValue = value.trim();
    this.setState({dirty: false});
  };

  componentWillReceiveProps(np) {
    const {cell, langtag} = np;
    const nextVal = f.defaultTo("")(
      (cell.isMultiLanguage)
        ? cell.value[langtag]
        : cell.value
    );
    if ((!this.state.dirty && nextVal !== this.originalValue)
      || cell !== this.props.cell || langtag !== this.props.langtag
    ) {
      this.setState({value: nextVal, dirty: false});
    }
  }

  handleChange = (event) => {
    this.setState({
      value: event.target.value,
      dirty: true
    });
  };

  componentWillUnmount() {
    this.saveEdits();
  };

  render() {
    const {funcs, thisUserCantEdit} = this.props;
    return (
      <div className="item-content shorttext"
           ref={el => { this.background = el; }}
           tabIndex={1}
      >
        <textarea value={this.state.value || ""}
               placeholder={i18n.t("table:empty.text")}
               disabled={thisUserCantEdit}
               onChange={this.handleChange}
               onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
               onBlur={this.saveEdits}
               ref={(funcs && funcs.register) ? el => { funcs.register(el); } : f.noop()}
        />
        {this.props.children}
      </div>
    );
  }
}

export default PoorTextComponent;
