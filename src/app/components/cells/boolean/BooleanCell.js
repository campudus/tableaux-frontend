import React from "react";

import PropTypes from "prop-types";

import { canUserChangeCell } from "../../../helpers/accessManagementHelper";
import { isLocked } from "../../../helpers/annotationHelper";

const BooleanCell = props => {
  const { actions, value, table, row, column, langtag, selected, cell } = props;

  const handleEditDone = newValue => {
    const valueToSave = column.multilanguage
      ? { [langtag]: newValue }
      : newValue;
    actions.changeCellValue({
      column,
      tableId: table.id,
      rowId: row.id,
      columnId: column.id,
      oldValue: value,
      newValue: valueToSave,
      kind: column.kind
    });
  };

  const getCheckboxValue = () => {
    return !!(column.multilanguage ? value[langtag] : value);
  };

  const toggleCheckboxValue = () => {
    if (!isLocked(row) && canUserChangeCell(cell, langtag)) {
      selected && handleEditDone(!getCheckboxValue());
    }
  };

  return (
    <div className={"cell-content"} onClick={toggleCheckboxValue}>
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
