import i18n from "i18next";
import f from "lodash/fp";
import PropTypes from "prop-types";
import React, { useMemo } from "react";
import { getDecimalDigits, isYearColumn } from "../../../helpers/columnHelper";
import { unless, when } from "../../../helpers/functools";
import { toLangtag } from "../../../helpers/multiLanguage";
import NumericEditCell from "./NumericEditCell.jsx";

const NumericCell = props => {
  const {
    actions,
    langtag,
    table,
    row,
    displayValue,
    value,
    editing,
    setCellKeyboardShortcuts,
    cell,
    cell: { column }
  } = props;

  const isMultiLanguage = column.multilanguage;
  const isYear = isYearColumn(column);
  const isInteger = column.kind === "integer";

  const handleEditDone = React.useCallback(newValue => {
    const validatedValue =
      f.isNil(newValue) || f.isNaN(newValue) ? null : newValue;
    const valueToSave = isMultiLanguage
      ? { [langtag]: validatedValue }
      : validatedValue;

    actions.changeCellValue({
      cell,
      column,
      columnId: column.id,
      rowId: row.id,
      tableId: table.id,
      oldValue: value,
      newValue: valueToSave
    });

    actions.toggleCellEditing({ editing: false });
  });

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(toLangtag(langtag), {
        maximumFractionDigits: getDecimalDigits(column)
      }),
    [langtag]
  );
  const formatNumber = x => (!isNaN(parseFloat(x)) ? formatter.format(x) : "");

  console.log(
    value,
    displayValue[langtag],
    formatNumber(displayValue[langtag])
  );

  if (!editing) {
    return (
      <div className="cell-content">
        {f.compose(
          when(f.overSome([f.isNil, f.isNaN]), () => ""),
          unless(() => isYear || !column.separator, formatNumber)
        )(displayValue[langtag])}
      </div>
    );
  } else {
    return (
      <NumericEditCell
        langtag={langtag}
        column={column}
        actions={actions}
        value={value}
        isMultiLanguage={isMultiLanguage}
        onSave={handleEditDone}
        setCellKeyboardShortcuts={setCellKeyboardShortcuts}
        separator={column.separator}
        isInteger={isInteger}
      />
    );
  }
};

NumericCell.propTypes = {
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  editing: PropTypes.bool.isRequired,
  setCellKeyboardShortcuts: PropTypes.func
};

export default NumericCell;
