import f from "lodash/fp";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { canUserChangeCountryTypeCell } from "../../../helpers/accessManagementHelper";
import { outsideClickEffect } from "../../../helpers/useOutsideClick";
import CurrencyRow from "./CurrencyRow";

const splitFloat = f.compose(
  splittedValue =>
    splittedValue.length === 1 ? f.concat(splittedValue, "") : splittedValue,
  f.split(/[,.]/),
  f.toString
);

// number -> [string, string]
const toCurrencyInputValue = splitFloat;

// [string, string] -> number
const fromCurrencyInputValue = f.compose(
  f.toNumber,
  f.join("."),
  f.map(stringVal => (f.isEmpty(stringVal) ? "0" : stringVal))
);

const CurrencyEditCell = ({
  cell,
  exitEditMode,
  langtag,
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

  const [inputValues, setInputvalues] = useState(
    Object.fromEntries(
      cell.column.countryCodes.map(country => [
        country,
        toCurrencyInputValue(value[country])
      ])
    )
  );

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
      setInputvalues({
        ...inputValues,
        [country]: f.isNil(inputValue) ? null : toCurrencyInputValue(inputValue)
      });
      onChange({
        ...value,
        [country]: f.isNil(inputValue)
          ? null
          : fromCurrencyInputValue(inputValue)
      });
    },
    [value]
  );

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
          const countryValue = inputValues[countryCode];
          const isDisabled = !canUserChangeCountryTypeCell(cell, countryCode);

          return (
            <CurrencyRow
              key={countryCode}
              country={countryCode}
              isFallbackValue={f.isNil(value[countryCode])}
              countryCurrencyValue={countryValue || ["", ""]}
              updateValue={handleChange}
              isDisabled={isDisabled}
              langtag={langtag}
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
