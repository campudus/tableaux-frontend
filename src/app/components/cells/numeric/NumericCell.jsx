import f from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import { getDecimalDigits, isYearColumn } from "../../../helpers/columnHelper";
import { unless, when } from "../../../helpers/functools";
import { formatNumber } from "../../../helpers/multiLanguage";
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

  const formatWithDigits = x => formatNumber(x, getDecimalDigits(column));

  if (!editing) {
    return (
      <div className="cell-content">
        {f.compose(
          when(f.overSome([f.isNil, f.isNaN]), () => ""),
          unless(() => isYear || !column.separator, formatWithDigits)
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
