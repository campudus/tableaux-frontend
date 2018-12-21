import React from "react";
import PropTypes from "prop-types";
import NumericEditCell from "./NumericEditCell.jsx";

const NumericCell = props => {
  const {
    actions,
    langtag,
    column,
    table,
    row,
    displayValue,
    value,
    editing,
    setCellKeyboardShortcuts
  } = props;

  const isMultiLanguage = column.multilanguage;

  const handleEditDone = newValue => {
    const oldValue = isMultiLanguage ? value[langtag] : value;
    const valueToSave = isMultiLanguage ? { [langtag]: newValue } : newValue;

    actions.changeCellValue({
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
  console.log(
    `Cell: [${column.id}/${row.id}]: displayValue:`,
    displayValue,
    "value:",
    value,
    "editing?",
    editing
  );

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
  value: PropTypes.any.isRequired,
  displayValue: PropTypes.string.isRequired,
  editing: PropTypes.bool.isRequired,
  langtag: PropTypes.string.isRequired,
  setCellKeyboardShortcuts: PropTypes.func
};

export default NumericCell;
