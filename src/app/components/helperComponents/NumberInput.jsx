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
  getLocaleDecimalSeparator
} from "../../helpers/multiLanguage";
import { when } from "../../helpers/functools";

export const MAX_DIGIT_LENGTH = 20; // 15 digits + 15 / 3 = 5 group separators
const digits = "0123456789";
const allowedSymbols = "-" + digits;
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
  const [valueString, setValueString_] = useState(String(value || 0));
  const formattedValue = formatValueString(
    localize,
    valueString,
    !integer && valueString.endsWith(".")
  );

  const setValueString = useCallback(string => {
    setValueString_(string);
    if (
      caretPosition >
      formatValueString(localize, string, !integer && string.endsWith("."))
        .length
    ) {
      setCaret(string.length);
    }
  });

  const [negative, setIsNegative] = useState(f.isNumber(value) && value < 0);

  const [caretPosition, setCaretPosition] = useState();
  const inputRef = useRef();
  // expose the focus() method to parents using ref
  useImperativeHandle(ref, () => ({
    focus() {
      inputRef.current.focus();
    }
  }));

  React.useEffect(() => {
    onChange && onChange(parseFloat(valueString));
  }, [valueString]);

  // Set DOM caret to logical caret position
  React.useEffect(() => {
    if (!inputRef.current) return;
    const visualCaretPosition = when(
      f.isNil,
      () => formattedValue.length,
      getDigitPositionInString(formattedValue, caretPosition)
    );
    console.log(
      "Setting DOM caret to",
      caretPosition,
      visualCaretPosition,
      formattedValue,
      formattedValue.length
    );
    inputRef.current.selectionStart = visualCaretPosition;
    inputRef.current.selectionEnd = visualCaretPosition;
  }, [caretPosition]);

  const setCaret = position => {
    const newCaretPosition =
      position === "end"
        ? valueString.length
        : f.clamp(0, valueString.length + 2, position);
    console.log(
      "setCaret",
      caretPosition,
      "->",
      position,
      "->",
      newCaretPosition
    );
    setCaretPosition(newCaretPosition);
  };

  const handleKeyDown = useCallback(event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return; // let browser commands pass
    event.preventDefault();
    console.log("Pressed:", event.key);
    onKeyDown && onKeyDown(event);
    const hasDecimalPoint = f.contains(".", valueString);
    if (
      !f.contains(event.key, [
        ...allowedSymbols,
        ...allowedKeys,
        ...(integer || hasDecimalPoint ? [] : [decimalSeparator])
      ])
    ) {
      return;
    }

    const formattedValueWithout = position =>
      deleteCharAt(position, valueString);

    const negateValue = () => {
      setCaret(negative ? Math.max(caretPosition - 1, 0) : caretPosition + 1);
      setIsNegative(!negative);
      setValueString(String(-parseFloat(valueString)));
    };

    if (event.key === "-") {
      negateValue();
    } else if (event.key === "ArrowLeft") {
      event.stopPropagation();
      setCaret(caretPosition - 1);
    } else if (event.key === "ArrowRight") {
      event.stopPropagation();
      setCaret(caretPosition + 1);
    } else if (event.key === "Backspace") {
      if (negative && caretPosition === 1) {
        negateValue();
      } else {
        setValueString(formattedValueWithout(caretPosition - 1));
        setCaret(caretPosition - 1);
      }
    } else if (event.key === "Delete") {
      if (negative && caretPosition === 0) {
        negateValue();
        setCaret(0);
      } else {
        setValueString(formattedValueWithout(caretPosition));
      }
    } else if (
      f.contains(event.key, digits) ||
      (!integer && event.key === decimalSeparator)
    ) {
      const toInsert = event.key === decimalSeparator ? "." : event.key;
      setValueString(insertCharAt(caretPosition, toInsert, valueString));
      setCaret(caretPosition + 1);
    }
  });

  const handleFocus = useCallback(event => {
    setCaret("end");
    onFocus && onFocus(event);
  });

  const handleChange = useCallback(() => {
    const asNumber = parseFloat(valueString);
    onChange && onChange(asNumber);
  });

  return (
    <input
      type="text"
      className={"formatted-numeric-input " + className}
      autoFocus={autoFocus || false}
      disabled={disabled || false}
      onFocus={handleFocus}
      onBlur={onBlur}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
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

export const getDigitPositionInString = (numberString, digitPosition) => {
  const localeGroupSeparator = getLocaleDecimalSeparator() === "," ? "." : ",";
  const getDigitPositionInStringImpl = (n, val = numberString, i = 0) => {
    const firstChar = f.head(val);
    const isFistCharDigit =
      f.contains(firstChar, allowedSymbols) ||
      firstChar === localeGroupSeparator;
    if (f.isNil(numberString[i])) return numberString.length;
    else if (n === 0 && isFistCharDigit) return i;
    else
      return getDigitPositionInStringImpl(
        isFistCharDigit ? n - 1 : n,
        f.tail(val),
        i + 1
      );
  };
  return getDigitPositionInStringImpl(digitPosition, numberString);
};

export const insertCharAt = f.curryN(3, (position, char, string = "") =>
  string
    ? position >= 0
      ? string.slice(0, position) + char + string.slice(position)
      : string
    : char
);

export const deleteCharAt = f.curryN(2, (position, string = "") =>
  string
    ? position >= 0
      ? position < string.length
        ? string.slice(0, position) + string.slice(position + 1)
        : string.slice(0, string.length - 1)
      : string
    : null
);

const formatValueString = (
  localize = true,
  valueString = "",
  addDecimalSeparator = false
) => {
  const hasDecimalSeparator = f.contains(".", valueString);
  const trailingZeroes =
    !addDecimalSeparator && hasDecimalSeparator
      ? f.takeRightWhile(f.eq("0"), valueString).length
      : 0;
  const mustAddDecimalSeparator =
    addDecimalSeparator ||
    (hasDecimalSeparator &&
      f.last(f.dropRightWhile(f.eq("0"), valueString)) === ".");
  return f.compose(
    str => str + f.repeat(trailingZeroes, "0"),
    when(
      () => mustAddDecimalSeparator,
      str => str + getLocaleDecimalSeparator()
    ),
    f.cond([
      [f.isEmpty, () => ""],
      [f.eq("-"), f.identity],
      [() => localize, formatNumber],
      [() => true, str => String(parseFloat(str))]
    ])
  )(valueString);
};
