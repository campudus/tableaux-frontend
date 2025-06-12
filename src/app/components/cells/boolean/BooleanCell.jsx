import PropTypes from "prop-types";
import React, { useEffect } from "react";
import { canUserChangeCell } from "../../../helpers/accessManagementHelper";
import { isLocked } from "../../../helpers/rowUnlock";

const BooleanCell = props => {
  const {
    actions,
    selected,
    editing,
    value,
    row,
    column,
    langtag,
    cell
  } = props;

  const handleEditDone = newValue => {
    const valueToSave = column.multilanguage
      ? { [langtag]: newValue }
      : newValue;
    actions.changeCellValue({
      cell,
      column,
      oldValue: value,
      newValue: valueToSave
    });
  };

  useEffect(() => {
    if (selected && !editing) {
      actions.toggleCellEditing({ editing: true });
    }
  }, [selected]);

  const getCheckboxValue = () => {
    return !!(column.multilanguage ? value[langtag] : value);
  };

  const handleClick = event => {
    if (editing) {
      event.stopPropagation();
      if (!isLocked(row) && canUserChangeCell(cell, langtag)) {
        handleEditDone(!getCheckboxValue());
      }
    }
  };

  return (
    <div className={"cell-content"} onClick={handleClick}>
      <input
        className="checkbox"
        type="checkbox"
        checked={getCheckboxValue()}
        readOnly={true}
      />
    </div>
  );
};

BooleanCell.propTypes = {
  actions: PropTypes.object.isRequired,
  value: PropTypes.any.isRequired,
  table: PropTypes.object.isRequired,
  row: PropTypes.object.isRequired,
  column: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired
};

export default BooleanCell;
