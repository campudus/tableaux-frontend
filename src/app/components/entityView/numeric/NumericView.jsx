import {
  compose,
  lifecycle,
  pure,
  withHandlers,
  withStateHandlers
} from "recompose";
import React from "react";
import f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";

import { isYearColumn } from "../../../helpers/columnHelper";
import { maybe } from "../../../helpers/functools";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import NumberInput from "../../helperComponents/NumberInput";

const enhance = compose(
  pure,
  withStateHandlers(
    ({ value, cell }) => {
      const oldValue = cell.value;
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
      handleChange: () => value => {
        return { value };
      },
      saveChanges: ({ oldValue, value }, props) => () => {
        const { actions, cell, langtag } = props;
        const newValue = cell.column.multiLanguage
          ? { [langtag]: value }
          : value;

        actions.changeCellValue({
          cell,
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
    },
    isKeyAllowed: () => event => {
      const numbers = f.map(f.toString, f.range(0, 10));
      const allowedKeys = [
        ...numbers,
        "-",
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
  saveChanges,
  cell
}) => {
  const isYear = isYearColumn(cell.column);
  return (
    <div className="item-content shorttext numeric" tabIndex={1}>
      <NumberInput
        ref={registerInput}
        disabled={thisUserCantEdit}
        value={value}
        placeholder={i18n.t("table:empty.number")}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={saveChanges}
        integer={isYear}
        localize={!isYear}
      />
      {children}
    </div>
  );
};

export default enhance(NumericView);

NumericView.propTypes = {
  cell: PropTypes.object.isRequired,
  value: PropTypes.any,
  langtag: PropTypes.string.isRequired,
  thisUserCantEdit: PropTypes.bool
};
