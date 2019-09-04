import NumberFormat from "react-number-format";
import React, { useRef, forwardRef, useImperativeHandle } from "react";

import PropTypes from "prop-types";

import {
  getLocaleDecimalSeparator,
  readLocalizedNumber
} from "../../helpers/multiLanguage";

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
  const thousandSeparator = decimalSeparator === "," ? "." : ",";

  const handleChange = event => {
    onChange && onChange(readLocalizedNumber(event.target.value));
  };

  const inputRef = useRef();

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current && inputRef.current.focus()
  }));

  return (
    <NumberFormat
      ref={inputRef}
      thousandSeparator={localize ? thousandSeparator : false}
      decimalSeparator={decimalSeparator}
      value={value}
      defaultValue={0}
      decimalScale={integer ? 0 : undefined}
      onBlur={onBlur}
      onChange={handleChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={"formatted-numeric-input " + className}
      disabled={disabled}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
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
