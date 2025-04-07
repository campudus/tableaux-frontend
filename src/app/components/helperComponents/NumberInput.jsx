import NumberFormat from "react-number-format";
import React, {
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle
} from "react";
import f from "lodash/fp";

const JAVA_INT_MAX = 2_147_483_647;
const JAVA_INT_MIN = -2_147_483_648;

// Here we can use that JS uses double precicion floats to represent all numbers
// and thus can handle bigger "integers" than Java.
// toStorableInteger: Number -> Number
export const toStorableInteger = f.cond([
  [n => n > JAVA_INT_MAX, () => JAVA_INT_MAX],
  [n => n < JAVA_INT_MIN, () => JAVA_INT_MIN],
  [f.stubTrue, f.identity]
]);

import PropTypes from "prop-types";

import {
  formatNumber,
  getLocaleDecimalSeparator,
  readLocalizedNumber
} from "../../helpers/multiLanguage";
import { doto, when } from "../../helpers/functools";

const MAX_DIGITS = 14;

const NumberInput = (props, ref) => {
  const {
    autoFocus,
    decimalDigits,
    disabled,
    className,
    value,
    onChange,
    onKeyDown,
    onFocus,
    onBlur,
    placeholder,
    localize = true,
    onClick = f.noop,
    onMouseDown = f.noop,
    separator
  } = props;

  const decimalSeparator = getLocaleDecimalSeparator();
  const thousandSeparator = decimalSeparator === "," ? "." : ",";

  const handleChange = event => {
    const input = readLocalizedNumber(event.target.value);
    const isInteger = decimalDigits === 0;
    const newValue = isInteger ? toStorableInteger(input) : input;
    onChange && onChange(newValue);
  };

  const inputRef = useRef();

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current && inputRef.current.focus()
  }));

  // Assure that we don't type more than MAX_DIGITS digits before the
  // decimal separator
  const handleKeyDown = useCallback(event => {
    const isDigit = f.contains(f.__, "0123456789");
    const formattedNumber = formatNumber(value, decimalDigits);
    const caretPosition = event.target.selectionStart;

    // When no decimal separator is typed yet, we assume it at the end
    // of the number
    const decimalPosition = when(
      f.gt(0),
      () => formattedNumber.length,
      f.findIndex(f.eq(decimalSeparator), formattedNumber)
    );

    const preDecimalDigits = doto(
      formattedNumber,
      f.take(decimalPosition),
      f.filter(isDigit),
      f.size
    );

    if (
      isDigit(event.key) &&
      preDecimalDigits >= MAX_DIGITS &&
      caretPosition <= decimalPosition
    ) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      onKeyDown && onKeyDown(event);
    }
  });

  return (
    <NumberFormat
      ref={inputRef}
      thousandSeparator={localize && separator ? thousandSeparator : false}
      decimalSeparator={decimalSeparator}
      value={value}
      defaultValue={0}
      decimalScale={decimalDigits}
      onBlur={onBlur}
      onChange={handleChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={"formatted-numeric-input " + className}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      onClick={onClick}
      onMouseDown={onMouseDown}
    />
  );
};

export default forwardRef(NumberInput);

NumberInput.propTypes = {
  autoFocus: PropTypes.bool,
  decimalDigits: PropTypes.number.isRequired,
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
