import React, { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import f from "lodash/fp";
import i18n from "i18next";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import { merge } from "../../../helpers/functools";
import {
  columnHasMinLength,
  columnHasMaxLength,
  isTextTooShort,
  getTextLength,
  isTextTooLong
} from "../../../helpers/limitTextLength";

const ShortTextView = props => {
  const {
    actions,
    cell,
    cell: { column },
    langtag,
    funcs,
    thisUserCantEdit,
    children
  } = props;

  const [oldValue, setOldValue] = useState(() => cell.value);
  const [value, setValue] = useState(() =>
    cell.column.multilanguage
      ? f.propOr("", ["value", langtag], cell)
      : f.propOr("", "value", cell)
  );

  const registerInput = useCallback(
    node => {
      funcs.register(node);
    },
    [funcs]
  );

  const handleChange = useCallback(event => setValue(event.target.value), []);

  const saveChanges = useCallback(() => {
    const newValue = cell.column.multilanguage ? { [langtag]: value } : value;

    const valueChanged = cell.column.multilanguage
      ? !f.eq(newValue[langtag], oldValue[langtag])
      : !f.eq(oldValue, newValue);

    if (valueChanged) {
      actions.changeCellValue({
        cell,
        oldValue,
        newValue
      });
    }

    setOldValue(cell.column.multilanguage ? merge(oldValue, newValue) : value);
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

  const { minLength, maxLength } = column;
  const minLengthText = columnHasMinLength(column)
    ? i18n.t("table:text-length:min-length-full", { minLength })
    : "";
  const maxLengthText = columnHasMaxLength(column)
    ? `${getTextLength(value)}/${maxLength}`
    : "";
  const textTooShort = isTextTooShort(column, value);
  const textTooShortErrorCssClass = textTooShort
    ? "selectable-shorttext_error"
    : "";

  const onChange = evt => {
    const newValue = evt.target.value;
    if (isTextTooLong(column, newValue)) {
      return;
    }
    handleChange(evt);
  };

  const onBlur = () => {
    if (isTextTooShort(column, value)) {
      return;
    }
    saveChanges();
  };
  return (
    <div className="item-content shorttext" tabIndex={1}>
      <input
        type="text"
        ref={registerInput}
        disabled={thisUserCantEdit}
        value={value || ""}
        placeholder={i18n.t("table:empty.text")}
        onChange={onChange}
        onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(
          getKeyboardShortcuts
        )}
        onBlur={onBlur}
      />
      <div className="length-limits">
        <div className={`min-length ${textTooShortErrorCssClass}`}>
          {minLengthText}{" "}
        </div>
        <div className="max-length">{maxLengthText} </div>
      </div>
      {children}
    </div>
  );
};

export default React.memo(ShortTextView);

ShortTextView.propTypes = {
  cell: PropTypes.object.isRequired,
  value: PropTypes.string,
  langtag: PropTypes.string.isRequired,
  thisUserCantEdit: PropTypes.bool
};
