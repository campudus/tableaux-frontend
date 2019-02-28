import React from "react";
import PropTypes from "prop-types";
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

  const handleEditDone = newValue => {
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
  };

  // TODO: remove logging
  //  console.assert(typeof actions.toggleCellEditing === "function", actions);

  if (!editing) {
    return <div className="cell-content">{displayValue[langtag]}</div>;
  } else {
    return (
      <NumericEditCell
        langtag={langtag}
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
