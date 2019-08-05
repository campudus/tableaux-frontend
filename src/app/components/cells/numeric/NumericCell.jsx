import React from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { formatNumber } from "../../../helpers/multiLanguage";
import { isYearColumn } from "../../../helpers/columnHelper";
import { unless, when } from "../../../helpers/functools";
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
    cell: { column }
  } = props;

  const isMultiLanguage = column.multilanguage;
  const isYear = isYearColumn(column);

  const handleEditDone = React.useCallback(newValue => {
    const oldValue = isMultiLanguage ? value[langtag] : value;
    const valueToSave = isMultiLanguage ? { [langtag]: newValue } : newValue;

    actions.changeCellValue({
      column,
      columnId: column.id,
      rowId: row.id,
      tableId: table.id,
      oldValue,
      newValue: valueToSave
    });

    actions.toggleCellEditing({ editing: false });
  });

  if (!editing) {
    return (
      <div className="cell-content">
        {f.compose(
          when(f.contains(f.__, ["0", "NaN"]), () => ""),
          unless(() => isYear, formatNumber)
        )(displayValue[langtag])}
      </div>
    );
  } else {
    return (
      <NumericEditCell
        langtag={langtag}
        actions={actions}
        value={value}
        isMultiLanguage={isMultiLanguage}
        onSave={handleEditDone}
        setCellKeyboardShortcuts={setCellKeyboardShortcuts}
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
