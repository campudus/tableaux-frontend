import i18n from "i18next";
import React, { useState } from "react";
import {
  columnHasMaxLength,
  columnHasMinLength,
  getTextLength,
  isTextTooLong,
  isTextTooShort
} from "../../../helpers/limitTextLength";

const TextEditOverlay = props => {
  const {
    actions,
    cell,
    cell: { column, value },
    langtag,
    readOnly
  } = props;

  const [editedValue, setEditedValue] = useState(
    (column.multilanguage ? value[langtag] : value) ?? ""
  );
  const saveEdits = () => {
    const newValue = column.multilanguage
      ? { ...value, [langtag]: editedValue }
      : editedValue;

    console.log("saveEdits", cell, value, newValue);
    actions.changeCellValue({ cell, oldValue: value, newValue });
  };

  const { minLength, maxLength } = column;
  const [clickedOutside, setClickedOutside] = React.useState(false);
  const minLengthText = columnHasMinLength(column)
    ? i18n.t("table:text-length:min-length-full", { minLength })
    : "";
  const maxLengthText = columnHasMaxLength(column)
    ? `${getTextLength(editedValue)}/${maxLength}`
    : "";
  const textTooShort = isTextTooShort(column, editedValue);
  const shouldCatchOutsideClick = textTooShort;
  const textTooShortErrorCssClass =
    clickedOutside && textTooShort ? "markdown-editor_error" : "";
  const onOutsideClick = evt => {
    setClickedOutside(true);
    evt.stopPropagation();
    evt.preventDefault();
  };
  const onChange = evt => {
    setClickedOutside(false);
    const value = evt.target.value;
    if (isTextTooLong(column, value)) {
      return;
    }
    setEditedValue(value);
  };
  const onBlur = () => {
    if (shouldCatchOutsideClick) {
      return;
    }
    saveEdits();
  };
  return (
    <div className="content-items richtext-cell-editor">
      <div className="item">
        {shouldCatchOutsideClick && (
          <div className="catchOutsideClick" onClick={onOutsideClick} />
        )}
        <div className="item-content shorttext textarea_wrapper" tabIndex={1}>
          <textarea
            className={textTooShortErrorCssClass}
            disabled={!!readOnly}
            value={editedValue}
            placeholder={i18n.t("table:empty.text")}
            onChange={onChange}
            onBlur={onBlur}
          />
        </div>
        <div className="length-limits">
          <div className={`min-length ${textTooShortErrorCssClass}`}>
            {minLengthText}{" "}
          </div>
          <div className="max-length">{maxLengthText} </div>
        </div>
      </div>
    </div>
  );
};

export default TextEditOverlay;
