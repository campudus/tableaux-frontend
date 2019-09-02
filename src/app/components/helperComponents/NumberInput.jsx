import React, {
  useCallback,
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
const allowedSymbols = "-0123456789";
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

  const handleChange = useCallback(event => {
    const inputValue = event.target.value;

    const fixSign = numericString => {
      //  whenever user hits `minus`, toggle sign
      const numDashes = f.filter(f.eq("-"), numericString).length;
      const cleanString = numericString.replace(/-/g, "");
      return numDashes % 2 === 0 ? cleanString : "-" + cleanString;
    };

    const readNumericString = f.compose(
      readLocalizedNumber,
      fixSign
    );

    const formattedInput = f.compose(
      when(
        () => f.last(inputValue) === decimalSeparator,
        str => str + decimalSeparator
      ),
      f.join(""),
      f.take(MAX_DIGIT_LENGTH),
      formatNumber,
      readNumericString
    )(inputValue);

    onChange(readNumericString(inputValue));

    const calculateDisplayedString = () => {
      //  special case: started typing negative number
      if (inputValue === "-") return inputValue;
      //  safety hatch for badly parsed input
      else if (f.contains(formattedInput, ["", "NaN"])) return "";
      //  localise if neccessary
      else if (localize) return formattedInput;
      else return inputValue;
    };

    setValue(calculateDisplayedString());
  });

  const inputRef = useRef();
  // expose the focus() method to parents using ref
  useImperativeHandle(ref, () => ({
    focus() {
      inputRef.current.focus();
    }
  }));

  const moveCaretToEnd = useCallback(() => {
    const l = formattedValue.length;
    maybe(inputRef.current).method("setSelectionrange", l, l);
    onFocus && onFocus();
  });

  const filterAllowedKeys = useCallback(event => {
    const hasComma = f.contains(decimalSeparator, event.target.value);

    //  If a decimal separator is already in the number, ignore it
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
  });

  const previousState = useRef();
  const rememberState = event =>
    (previousState.current = {
      value: formattedValue,
      selectionStart: event.target.selectionStart
    });

  const maybeIgnoreKeyEvent = event => {
    const shouldProcessKeyPress = filterAllowedKeys(event);
    shouldProcessKeyPress && onKeyDown && onKeyDown(event);
    return shouldProcessKeyPress;
  };

  // side effect: remembers caret position and state
  const handleKeyDown = useCallback(event => {
    maybeIgnoreKeyEvent(event) && rememberState(event);
  });

  // side effect: set correct caret position
  const handleKeyUp = useCallback(event => {
    if (f.isNil(previousState.current)) {
      return;
    }
    const oldPos = previousState.current.selectionStart;
    const newPos = event.target.selectionStart;
    const delta = newPos - oldPos;
    if (Math.abs(delta) > 1) {
      const dir = formattedValue.length - previousState.current.value.length;
      const fixedPos = oldPos + dir; // modify caret position by string length difference
      event.target.selectionStart = fixedPos;
      event.target.selectionEnd = fixedPos;
    }
    previousState.current = null;
  });

  return (
    <input
      type="text"
      className={"formatted-numeric-input " + className}
      autoFocus={autoFocus || false}
      disabled={disabled || false}
      onFocus={moveCaretToEnd}
      onBlur={onBlur}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
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
