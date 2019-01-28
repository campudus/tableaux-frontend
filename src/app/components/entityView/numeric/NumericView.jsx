import React from "react";
import PropTypes from "prop-types";
import {
  compose,
  lifecycle,
  pure,
  withHandlers,
  withStateHandlers
} from "recompose";
import f from "lodash/fp";
import i18n from "i18next";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import { maybe } from "../../../helpers/functools";

const enhance = compose(
  pure,
  withStateHandlers(
    ({ value, cell, langtag }) => {
      const oldValue = cell.column.multilanguage ? { [langtag]: value } : value;
      return {
        oldValue,
        value: maybe(value)
          .map(parseFloat)
          .getOrElse(0)
      };
    },
    {
      registerInput: (state, { funcs }) => node => {
        funcs.register(node);
      },
      handleChange: () => event => {
        const inputString = event.target.value.replace(/,/g, ".");
        const value =
          inputString.split(".").length > 2
            ? inputString.substr(0, inputString.length - 1)
            : inputString;
        return { value };
      },
      saveChanges: ({ oldValue, value }, props) => () => {
        const { actions, cell, langtag } = props;
        // value might have been converted to string in the meantime; this is necessary to be able to
        // add a decimal seperator with the editor still behaving naturally
        const _value = parseFloat(value);
        const newValue = cell.column.multiLanguage
          ? { [langtag]: _value }
          : _value;

        actions.changeCellValue({
          tableId: cell.table.id,
          columnId: cell.column.id,
          rowId: cell.row.id,
          oldValue,
          newValue
        });
      }
    }
  ),
  withHandlers({
    getKeyboardShortcuts: ({ saveChanges }) => () => {
      const captureEventAnd = fn => event => {
        event.stopPropagation();
        event.preventDefault();
        (fn || function() {})(event);
      };

      return {
        escape: captureEventAnd(saveChanges),
        enter: captureEventAnd(saveChanges)
      };
    }
  }),
  withHandlers({
    isKeyAllowed: () => event => {
      const numbers = f.map(f.toString, f.range(0, 10));
      const allowedKeys = [
        ...numbers,
        ".",
        ",",
        "ArrowLeft",
        "ArrowRight",
        "Enter",
        "Return",
        "Escape",
        "Backspace",
        "Delete",
        "Tab",
        "ArrowUp",
        "ArrowDown"
      ];
      if (!f.contains(event.key, allowedKeys)) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
      return true;
    }
  }),
  withHandlers({
    handleKeyDown: ({ isKeyAllowed, getKeyboardShortcuts }) => event => {
      if (isKeyAllowed(event)) {
        KeyboardShortcutsHelper.onKeyboardShortcut(getKeyboardShortcuts)(event);
      }
    }
  }),
  lifecycle({
    componentWillUnmount() {
      this.props.saveChanges();
    }
  })
);

const NumericView = ({
  value,
  registerInput,
  handleChange,
  thisUserCantEdit,
  children,
  handleKeyDown,
  saveChanges
}) => (
  <div className="item-content shorttext" tabIndex={1}>
    <input
      type="text"
      ref={registerInput}
      disabled={thisUserCantEdit}
      value={value}
      placeholder={i18n.t("table:empty.number")}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={saveChanges}
    />
    {children}
  </div>
);

export default enhance(NumericView);

NumericView.propTypes = {
  cell: PropTypes.object.isRequired,
  value: PropTypes.any,
  langtag: PropTypes.string.isRequired,
  thisUserCantEdit: PropTypes.bool
};
