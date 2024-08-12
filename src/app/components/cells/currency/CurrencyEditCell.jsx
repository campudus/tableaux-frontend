import f from "lodash/fp";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useRef } from "react";
import { canUserChangeCountryTypeCell } from "../../../helpers/accessManagementHelper";
import { outsideClickEffect } from "../../../helpers/useOutsideClick";
import {
  getCurrencyWithCountry,
  maybeAddZeroToDecimals
} from "./currencyHelper";
import CurrencyRow from "./CurrencyRow";

const splitFloat = f.compose(
  splittedValue =>
    splittedValue.length === 1 ? f.concat(splittedValue, "") : splittedValue,
  f.split("."),
  f.toString
);

// number -> [string, string]
const toCurrencyInputValue = f.compose(
  maybeAddZeroToDecimals,
  splitFloat
);

// [string, string] -> number
const fromCurrencyInputValue = f.compose(
  f.toNumber,
  f.join("."),
  f.map(stringVal => (f.isEmpty(stringVal) ? "0" : stringVal))
);

const CurrencyEditCell = ({
  cell,
  exitEditMode,
  onChange,
  setCellKeyboardShortcuts,
  value
}) => {
  const containerRef = useRef();
  outsideClickEffect({
    shouldListen: true,
    containerRef,
    onOutsideClick: exitEditMode
  });

  useEffect(() => {
    setCellKeyboardShortcuts({
      always: event => {
        event.stopPropagation();
      },
      enter: event => {
        event.preventDefault();
        event.stopPropagation();
        exitEditMode();
      },
      escape: event => {
        event.preventDefault();
        exitEditMode();
      }
    });
    return () => {
      setCellKeyboardShortcuts({});
    };
  }, []);

  const handleChange = useCallback(
    (country, inputValue) => {
      onChange({
        ...value,
        [country]: fromCurrencyInputValue(inputValue)
      });
    },
    [value]
  );

  const inputValues = f.mapValues(toCurrencyInputValue, value);

  return (
    <div
      className="cell-currency-rows"
      ref={containerRef}
      onClick={evt => {
        evt.stopPropagation();
      }}
    >
      <div className="rows-container">
        {cell.column.countryCodes.map(countryCode => {
          const value = getCurrencyWithCountry(inputValues, countryCode, true);
          const isDisabled = !canUserChangeCountryTypeCell(cell, countryCode);

          return (
            <CurrencyRow
              key={countryCode}
              country={countryCode}
              isFallbackValue={!f.get(["value", countryCode], cell)}
              countryCurrencyValue={value || ["", ""]}
              updateValue={handleChange}
              isDisabled={isDisabled}
            />
          );
        })}
      </div>
    </div>
  );
};

CurrencyEditCell.propTypes = {
  cell: PropTypes.object.isRequired,
  exitEditMode: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  setCellKeyboardShortcuts: PropTypes.func.isRequired,
  value: PropTypes.object.isRequired
};

export default CurrencyEditCell;
