import React from "react";
import PropTypes from "prop-types";
import NumericEditCell from "./NumericEditCell.jsx";
// import ActionCreator from "../../../actions/ActionCreator";
import {prop, isNil} from "lodash/fp";
// import changeCell from "../../../models/helpers/changeCell";

const NumericCell = (props) => {
  const {cell, langtag, contentChanged, editing, setCellKeyboardShortcuts} = props;

  const handleEditDone = (newValue) => {
    const oldValue = prop(["value", langtag], cell) || prop("value", cell);
    if (newValue === oldValue || (isNil(newValue) && isNil(oldValue))) {
      // ActionCreator.toggleCellEditing({editing: false});
      return;
    }
    const valueToSave = (cell.isMultiLanguage)
      ? {[langtag]: newValue}
      : newValue;
    // changeCell({cell, value: valueToSave}).then(contentChanged(cell, langtag, oldValue));
    // ActionCreator.toggleCellEditing({editing: false});
  };

  if (!editing) {
    return (
      <div className="cell-content">
        {(cell.isMultiLanguage) ? cell.value[langtag] : cell.value}
      </div>
    );
  } else {
    return <NumericEditCell cell={cell}
      langtag={langtag}
      onSave={handleEditDone}
      setCellKeyboardShortcuts={setCellKeyboardShortcuts} />;
  }
};

NumericCell.propTypes = {
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  editing: PropTypes.bool.isRequired,
  setCellKeyboardShortcuts: PropTypes.func
};

export default NumericCell;
