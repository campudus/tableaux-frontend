import React from "react";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import i18n from "i18next";
import PropTypes from "prop-types";
import { withStateHandlers } from "recompose";

class TextView extends React.PureComponent {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired,
    thisUserCantEdit: PropTypes.bool,
    actions: PropTypes.object.isRequired
  };

  getKeyboardShortcuts = () => {
    const captureEventAnd = fn => event => {
      event.stopPropagation();
      event.preventDefault();
      (fn || function() {})(event);
    };

    return {
      //      escape: captureEventAnd(() => { this.background.focus() }),
      escape: captureEventAnd(this.props.saveEdits),
      enter: event => event.stopPropagation(),
      up: event => event.stopPropagation(),
      down: event => event.stopPropagation()
    };
  };

  componentWillUnmount() {
    this.props.saveEdits();
  }

  setRef = node => {
    const { funcs } = this.props;
    if (funcs && funcs.register) {
      funcs.register(node);
    }
  };

  render() {
    const { thisUserCantEdit, editValue, handleChange, saveEdits } = this.props;

    return (
      <div className="item-content shorttext" tabIndex={1}>
        <textarea
          value={editValue}
          placeholder={i18n.t("table:empty.text")}
          disabled={thisUserCantEdit}
          onChange={handleChange}
          onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(
            this.getKeyboardShortcuts
          )}
          onBlur={saveEdits}
          ref={this.setRef}
        />
        {this.props.children}
      </div>
    );
  }
}

const withEditFunction = withStateHandlers(
  ({ langtag, cell }) => ({
    editValue:
      (cell.column.multilanguage ? cell.value[langtag] : cell.value) || ""
  }),
  {
    handleChange: () => event => ({
      editValue: event.target.value
    }),
    saveEdits: ({ editValue }, { value, langtag, cell, actions }) => () => {
      const newValue = cell.column.multilanguage
        ? { ...cell.value, [langtag]: editValue }
        : editValue;
      actions.changeCellValue({ cell, newValue, oldValue: cell.value });
    }
  }
);

export default withEditFunction(TextView);
