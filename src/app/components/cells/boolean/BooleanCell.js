import React from "react";
import PropTypes from "prop-types";
import "../../../../scss/main.scss";

const BooleanCell = props => {
  const {
    actions,
    value,
    table,
    row,
    column,
    langtag,
    setCellKeyboardShortcuts,
    selected
  } = props;

  const handleEditDone = newValue => {
    const valueToSave = column.isMultiLanguage
      ? { [langtag]: newValue }
      : newValue;
    actions.changeCellValue({
      tableId: table.id,
      rowId: row.id,
      columnId: column.id,
      oldValue: value,
      newValue: valueToSave,
      kind: column.kind
    });
  };

  const getCheckboxValue = () => {
    return !!(column.isMultiLanguage ? value[langtag] : value);
  };

  const toggleCheckboxValue = () => {
    // FIXME: Respect locking status
    // if (isLocked(cell.row)) {
    //   askForSessionUnlock(cell.row);
    // } else if (selected) {
    //   handleEditDone(!getCheckboxValue());
    // }
    handleEditDone(!getCheckboxValue());
  };

  setCellKeyboardShortcuts({
    enter: evt => {
      selected && toggleCheckboxValue();
    }
  });

  return (
    <div className={"cell-content"} onClick={toggleCheckboxValue}>
      <input
        className="checkbox"
        type="checkbox"
        checked={getCheckboxValue()}
        readOnly="readOnly"
      />
    </div>
  );
};

BooleanCell.propTypes = {
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired,
  setCellKeyboardShortcuts: PropTypes.func
};

export default BooleanCell;
