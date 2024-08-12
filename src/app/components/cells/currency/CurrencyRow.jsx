import classNames from "classnames";
import f from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import { getModifiers } from "../../../helpers/modifierState";
import {
  getCurrencyCode,
  getLanguageOrCountryIcon,
  getLocaleDecimalSeparator
} from "../../../helpers/multiLanguage";

const Pos = {
  pre: 0,
  post: 1
};

const allowedKeys = [
  ..."0123456789".split(""),
  "Backspace",
  "Delete",
  "Tab",
  "Enter",
  "Escape",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown"
];

const filterKeys = event => {
  const isAllowedKey = allowedKeys.includes(event.key);
  const modifiers = getModifiers(event);
  if (!isAllowedKey && modifiers.none) {
    event.preventDefault();
  }
};

const CurrencyRow = ({
  country,
  countryCurrencyValue: value,
  isFallbackValue,
  updateValue,
  isDisabled,
  langtag
}) => {
  const handleChange = idx => event => {
    const newValue = event.target.value;
    const cleanValue = idx === Pos.post ? newValue.substring(0, 2) : newValue;
    const updated = f.assoc(idx, cleanValue, value);
    updateValue(country, updated);
  };
  const rowClass = classNames("currency-row", {
    "grey-out": isFallbackValue,
    disabled: isDisabled
  });

  return (
    <div className={rowClass}>
      <div className="country-code">{getLanguageOrCountryIcon(country)}</div>
      <div className="currency-value">
        <input
          className="currency-input integer"
          disabled={isDisabled}
          onChange={handleChange(Pos.pre)}
          onKeyDown={filterKeys}
          placeholder="0"
          value={value[Pos.pre] ?? ""}
        />
        <span className="delimiter">{getLocaleDecimalSeparator(langtag)}</span>
        <input
          className="currency-input decimals"
          disabled={isDisabled}
          onChange={handleChange(Pos.post)}
          onKeyDown={filterKeys}
          placeholder="00"
          value={value[Pos.post]}
        />
      </div>
      <div className="currency-code">{getCurrencyCode(country)}</div>
    </div>
  );
};

CurrencyRow.propTypes = {
  country: PropTypes.string.isRequired,
  countryCurrencyValue: PropTypes.arrayOf(PropTypes.string),
  isFallbackValue: PropTypes.bool.isRequired,
  updateValue: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default CurrencyRow;
