import React, { useCallback, useEffect, useRef, useState } from "react";
import f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";

import { getDecimalDigits, isYearColumn } from "../../../helpers/columnHelper";
import { maybe } from "../../../helpers/functools";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import NumberInput from "../../helperComponents/NumberInput";
import { getModifiers } from "../../../helpers/modifierState";

const isKeyAllowed = event => {
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
  const modifier = getModifiers(event);
  const systemKeys = ["c", "v"];
  const isSystemCombo = modifier.mod && systemKeys.includes(event.key);
  if (!f.contains(event.key, allowedKeys) && !isSystemCombo) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
  return true;
};

const NumericView = props => {
  const {
    actions,
    cell,
    langtag,
    funcs,
    thisUserCantEdit,
    children,
    value: initialValue
  } = props;

  const [oldValue] = useState(() => cell.value);
  const [value, setValue] = useState(() =>
    maybe(initialValue)
      .map(parseFloat)
      .getOrElse(NaN)
  );

  const registerInput = useCallback(
    node => {
      funcs.register(node);
    },
    [funcs]
  );

  const handleChange = useCallback(newValue => setValue(newValue), []);

  const saveChanges = useCallback(() => {
    const validatedValue = f.isNil(value) || f.isNaN(value) ? null : value;
    const newValue = cell.column.multiLanguage
      ? { [langtag]: validatedValue }
      : validatedValue;

    actions.changeCellValue({
      cell,
      oldValue,
      newValue
    });
  }, [actions, cell, langtag, oldValue, value]);

  // keep the unmount handler on the latest state without re-running the effect
  const saveChangesRef = useRef(saveChanges);
  saveChangesRef.current = saveChanges;
  useEffect(() => () => saveChangesRef.current(), []);

  const getKeyboardShortcuts = useCallback(() => {
    const captureEventAnd = fn => event => {
      event.stopPropagation();
      event.preventDefault();
      (fn || function() {})(event);
    };

    return {
      escape: captureEventAnd(saveChanges),
      enter: captureEventAnd(saveChanges)
    };
  }, [saveChanges]);

  const handleKeyDown = useCallback(
    event => {
      if (isKeyAllowed(event)) {
        KeyboardShortcutsHelper.onKeyboardShortcut(getKeyboardShortcuts)(event);
      }
    },
    [getKeyboardShortcuts]
  );

  const isYear = isYearColumn(cell.column);
  return (
    <div className="item-content shorttext numeric" tabIndex={1}>
      <NumberInput
        ref={registerInput}
        decimalDigits={getDecimalDigits(cell.column)}
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

export default React.memo(NumericView);

NumericView.propTypes = {
  cell: PropTypes.object.isRequired,
  value: PropTypes.any,
  langtag: PropTypes.string.isRequired,
  thisUserCantEdit: PropTypes.bool
};
