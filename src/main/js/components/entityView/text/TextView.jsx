import React from "react";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import ActionCreator from "../../../actions/ActionCreator";
import i18n from "i18next";
import * as f from "lodash/fp";
import PropTypes from "prop-types";

import {contentChanged} from "../../cells/Cell";

class TextView extends React.Component {
  constructor(props) {
    super(props);
    this.originalValue = this.getValue().trim();
    this.state = {
      value: this.originalValue,
      dirty: false
    };
  };

  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired,
    thisUserCantEdit: PropTypes.bool
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
      enter: (event) => event.stopPropagation(),
      up: (event) => event.stopPropagation(),
      down: (event) => event.stopPropagation()
    };
  };

  saveEdits = () => {
    const {dirty, value} = this.state;
    if (!dirty || f.isNil(value) || value.trim() === this.originalValue) {
      return;
    }
    if (this.props.saveCell) {
      this.props.saveCell(value);
      return;
    }
    const {cell, langtag} = this.props;
    ActionCreator.changeCell(
      cell,
      ((cell.isMultiLanguage) ? {[langtag]: value} : value),
      contentChanged(cell, langtag, this.originalValue)
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

  setRef = (node) => {
    const {funcs} = this.props;
    if (funcs && funcs.register) {
      funcs.register(node);
    }
  };

  render() {
    const {thisUserCantEdit} = this.props;

    return (
      <div className="item-content shorttext"
        tabIndex={1}
      >
        <textarea value={this.state.value || ""}
          placeholder={i18n.t("table:empty.text")}
          disabled={thisUserCantEdit}
          onChange={this.handleChange}
          onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
          onBlur={this.saveEdits}
          ref={this.setRef}
        />
        {this.props.children}
      </div>
    );
  }
}

export default TextView;
