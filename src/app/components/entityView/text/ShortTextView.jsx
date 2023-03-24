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
import { merge } from "../../../helpers/functools";
import {
  columnHasMinLength,
  columnHasMaxLength,
  isTextTooShort,
  getTextLength,
  isTextTooLong
} from "../../../helpers/limitTextLength";

const enhance = compose(
  pure,
  withStateHandlers(
    ({ cell, langtag }) => {
      const oldValue = cell.value;
      return {
        oldValue,
        value: cell.column.multilanguage
          ? f.propOr("", ["value", langtag], cell)
          : f.propOr("", "value", cell)
      };
    },
    {
      registerInput: (state, { funcs }) => node => {
        funcs.register(node);
      },
      handleChange: () => event => ({ value: event.target.value }),
      saveChanges: ({ value, oldValue }, { actions, cell, langtag }) => () => {
        const newValue = cell.column.multilanguage
          ? { [langtag]: value }
          : value;

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

        return {
          oldValue: cell.column.multilanguage
            ? merge(oldValue, newValue)
            : value
        };
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
  lifecycle({
    componentWillUnmount() {
      this.props.saveChanges();
    }
  })
);

const ShortTextView = ({
  value,
  registerInput,
  handleChange,
  thisUserCantEdit,
  children,
  getKeyboardShortcuts,
  saveChanges,
  cell: { column }
}) => {
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

export default enhance(ShortTextView);

ShortTextView.propTypes = {
  cell: PropTypes.object.isRequired,
  value: PropTypes.string,
  langtag: PropTypes.string.isRequired,
  thisUserCantEdit: PropTypes.bool
};
