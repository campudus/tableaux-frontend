import React from "react";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import i18n from "i18next";
import * as f from "lodash/fp";
import PropTypes from "prop-types";

class TextView extends React.Component {
  constructor(props) {
    super(props);
    const {
      value,
      cell: { column },
      langtag
    } = this.props;
    this.originalValue = column.multilanguage ? value[langtag] : value;
    this.state = {
      value: this.originalValue,
      dirty: false
    };
  }

  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired,
    thisUserCantEdit: PropTypes.bool,
    actions: PropTypes.object.isRequired
  };

  getValue = () => {
    const {
      value,
      cell: { column },
      langtag
    } = this.props;
    return column.multilanguage ? value[langtag] : value;
  };

  getKeyboardShortcuts = () => {
    const captureEventAnd = fn => event => {
      event.stopPropagation();
      event.preventDefault();
      (fn || function() {})(event);
    };

    return {
      //      escape: captureEventAnd(() => { this.background.focus() }),
      escape: captureEventAnd(this.saveEdits),
      enter: event => event.stopPropagation(),
      up: event => event.stopPropagation(),
      down: event => event.stopPropagation()
    };
  };

  saveEdits = () => {
    const { dirty, value } = this.state;
    if (!dirty) {
      console.log("Early out without saving");
      return;
    }
    console.log("Saving new value:", value);
    const {
      actions: { changeCellValue },
      cell: { column, row, table },
      langtag
    } = this.props;

    changeCellValue({
      oldValue: this.originalValue,
      newValue: column.multilanguage ? { [langtag]: value } : value,
      tableId: table.id,
      columnId: column.id,
      rowId: row.id
    });

    this.originalValue = value.trim();
    this.setState({ dirty: false });
  };

  componentWillReceiveProps(np) {
    const { cell, langtag } = np;
    const nextVal = f.defaultTo("")(
      cell.isMultiLanguage ? cell.value[langtag] : cell.value
    );
    if (
      (!this.state.dirty && nextVal !== this.originalValue) ||
      cell !== this.props.cell ||
      langtag !== this.props.langtag
    ) {
      this.setState({ value: nextVal, dirty: false });
    }
  }

  handleChange = event => {
    this.setState({
      value: event.target.value,
      dirty: true
    });
  };

  componentWillUnmount() {
    this.saveEdits();
  }

  setRef = node => {
    const { funcs } = this.props;
    if (funcs && funcs.register) {
      funcs.register(node);
    }
  };

  render() {
    const { thisUserCantEdit } = this.props;

    return (
      <div className="item-content shorttext" tabIndex={1}>
        <textarea
          value={this.state.value || ""}
          placeholder={i18n.t("table:empty.text")}
          disabled={thisUserCantEdit}
          onChange={this.handleChange}
          onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(
            this.getKeyboardShortcuts
          )}
          onBlur={this.saveEdits}
          ref={this.setRef}
        />
        {this.props.children}
      </div>
    );
  }
}

export default TextView;
