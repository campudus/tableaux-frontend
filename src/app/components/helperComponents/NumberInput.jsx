import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle
} from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import {
  formatNumber,
  getLocaleDecimalSeparator,
  readLocalizedNumber
} from "../../helpers/multiLanguage";
import { maybe, when } from "../../helpers/functools";

export const MAX_DIGIT_LENGTH = 20; // 15 digits + 15 / 3 = 5 group separators
const allowedSymbols = "0123456789";
const allowedKeys = [
  "Enter",
  "Escape",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Backspace",
  "Delete"
];

const NumberInput = (props, ref) => {
  const {
    autoFocus,
    disabled,
    className,
    value,
    onChange,
    onKeyDown,
    onFocus,
    onBlur,
    placeholder,
    localize = true,
    integer = false
  } = props;

  const decimalSeparator = getLocaleDecimalSeparator();

  const [formattedValue, setValue] = useState(
    when(() => localize, formatNumber, value)
  );
  const handleChange = event => {
    const inputValue = event.target.value;
    const formattedInput = f.compose(
      when(
        () => f.last(inputValue) === decimalSeparator,
        str => str + decimalSeparator
      ),
      f.join(""),
      f.take(MAX_DIGIT_LENGTH),
      formatNumber,
      readLocalizedNumber
    )(inputValue);

    onChange(readLocalizedNumber(inputValue));
    const stateValue = f.contains(formattedInput, ["", "0", "NaN"])
      ? ""
      : localize
      ? formattedInput
      : inputValue;
    setValue(stateValue);
  };

  const inputRef = useRef();
  // expose the focus() method to parents using ref
  useImperativeHandle(ref, () => ({
    focus() {
      inputRef.current.focus();
    }
  }));

  const moveCaretToEnd = () => {
    const l = formattedValue.length;
    maybe(inputRef.current).method("setSelectionrange", l, l);
    onFocus && onFocus();
  };

  const filterAllowedKeys = event => {
    const hasComma = f.contains(decimalSeparator, event.target.value);

    // If a decimal separator is already in the number, ignore it
    const allowedKeyStrokes = [
      ...(hasComma || integer ? [] : [decimalSeparator]),
      ...allowedSymbols,
      ...allowedKeys
    ];
    if (
      !(event.altKey || event.ctrlKey || event.metaKey) &&
      !f.contains(event.key, allowedKeyStrokes)
    ) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    return true;
  };

  const maybeIgnoreKeyEvent = event => {
    filterAllowedKeys(event) && onKeyDown && onKeyDown(event);
  };

  return (
    <input
      type="text"
      className={"formatted-numeric-input " + className}
      autoFocus={autoFocus || false}
      disabled={disabled || false}
      onFocus={moveCaretToEnd}
      onBlur={onBlur}
      onChange={handleChange}
      onKeyDown={maybeIgnoreKeyEvent}
      value={formattedValue}
      ref={inputRef}
      placeholder={placeholder}
    />
  );
};

export default forwardRef(NumberInput);

NumberInput.propTypes = {
  autoFocus: PropTypes.bool,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  integer: PropTypes.bool,
  localize: PropTypes.bool
};
