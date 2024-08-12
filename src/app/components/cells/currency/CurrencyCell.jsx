import f from "lodash/fp";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useState } from "react";
import { translate } from "react-i18next";
import { when } from "../../../helpers/functools.js";
import {
  formatNumber,
  getCountryOfLangtag,
  getCurrencyCode,
  getLocaleDecimalSeparator
} from "../../../helpers/multiLanguage";
import CurrencyEditCell from "./CurrencyEditCell";
import {
  getCurrencyWithCountry,
  maybeAddZeroToDecimals,
  splitPriceDecimals
} from "./currencyHelper";

const stopPropagation = event => event?.stopPropagation();

const previewStyle = { top: 0, bottom: 0 };
const editingStyle = shiftUp =>
  shiftUp ? { top: -125, bottom: -45 } : { top: 0, bottom: -170 };
const getStyle = ({ editing, shiftUp }) =>
  editing ? editingStyle(shiftUp) : previewStyle;

const DisplayPrice = translate(["table"])(({ country, t, currencyValues }) => {
  const value = getCurrencyWithCountry(currencyValues, country, true);
  const toValueString = f.compose(
    maybeAddZeroToDecimals,
    f.map(when(f.isEmpty, () => "00")),
    splitPriceDecimals
  );
  const valueStrings = toValueString(value);
  const currencyCode = getCurrencyCode(country);

  const cssClass = `currency-wrapper${
    currencyValues[country] ? "" : " grey-out"
  }`;
  return currencyCode ? (
    <div className={cssClass}>
      <span className="currency-valye">{formatNumber(valueStrings[0], 0)}</span>
      <span className="currency-value-decimals">
        {getLocaleDecimalSeparator()}
        {valueStrings[1]}
      </span>
      <span className="currency-code">{currencyCode}</span>
      <i className="open-country fa fa-angle-down"></i>
    </div>
  ) : (
    <div className="currency-wrapper">
      <span className="currency-no-country">
        {t("error_language_is_no_country")}
        <i className="open-country fa fa-angle-down" />
      </span>
    </div>
  );
});

const CurrencyCell = ({
  actions,
  cell,
  editing,
  langtag,
  setCellKeyboardShortcuts
}) => {
  const [shiftUp, setShiftUp] = useState(false);
  const saveCellValue = useCallback(value => {
    actions.changeCellValue({ cell, oldValue: cell.value, newValue: value });
  }, []);
  const exitEditMode = useCallback(() => {
    actions.toggleCellEditing({
      editing: false,
      tableId: cell.table.id,
      columnId: cell.columnId,
      rowId: cell.row.id,
      langtag
    });
  }, []);

  const [value, setValue] = useState({});
  const [dirty, setDirty] = useState(false);
  const handleChange = useCallback(val => {
    setValue(val);
    setDirty(true);
  });

  useEffect(() => {
    if (!editing && dirty) {
      saveCellValue(value);
      setDirty(false);
    }
  }, [editing, value]);
  useEffect(() => {
    // this is the cost of multiple state keeping
    setValue(cell.value);
  }, [cell.value]);

  const checkPosition = useCallback(
    domNode => {
      if (!f.isNil(domNode)) {
        const rect = domNode.getBoundingClientRect();
        const unshiftedBottom = shiftUp ? rect.bottom + 180 : rect.bottom + 10;
        const needsShiftUp = editing && unshiftedBottom >= window.innerHeight;
        if (needsShiftUp !== shiftUp) {
          setShiftUp(needsShiftUp);
        }
      }
    },
    [shiftUp, editing]
  );

  return (
    <div
      ref={checkPosition}
      className="cell-content"
      onScroll={stopPropagation}
      style={getStyle({ editing, shiftUp })}
    >
      {editing ? (
        <CurrencyEditCell
          cell={cell}
          exitEditMode={exitEditMode}
          onChange={handleChange}
          setCellKeyboardShortcuts={setCellKeyboardShortcuts}
          value={value}
          langtag={langtag}
        />
      ) : (
        <DisplayPrice
          country={getCountryOfLangtag(langtag)}
          currencyValues={cell.value}
        />
      )}
    </div>
  );
};

CurrencyCell.propTypes = {
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired,
  editing: PropTypes.bool.isRequired,
  setCellKeyboardShortcuts: PropTypes.func
};

export default CurrencyCell;
