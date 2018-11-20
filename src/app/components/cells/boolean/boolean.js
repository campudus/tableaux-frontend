import React from "react";
import PropTypes from "prop-types";
import {pure} from "recompose";
import '../../../../scss/main.scss';

const BooleanCell = (props) => {
  const {cell, langtag, selected, setCellKeyboardShortcuts, toggleCheckboxValue} = props;

  // const handleEditDone = (newValue) => {
  //   const valueToSave = (cell.isMultiLanguage)
  //     ? {[langtag]: newValue}
  //     : newValue;
  //   ActionCreator.changeCell(cell, valueToSave);
  // };

  const getCheckboxValue = () => {
    return !!((cell.isMultiLanguage) ? cell.value[langtag] : cell.value);
  };

  // const toggleCheckboxValue = () => {
  //   if (isLocked(cell.row)) {
  //     askForSessionUnlock(cell.row);
  //   } else if (selected) {
  //     handleEditDone(!getCheckboxValue());
  //   }
  // };

  // setCellKeyboardShortcuts({
  //   enter: evt => {
  //     toggleCheckboxValue();
  //   }
  // });
  
  return (
    <div className={"cell-content"} onClick={toggleCheckboxValue} >
      <input className="checkbox" type="checkbox"
        checked={getCheckboxValue()}
        readOnly="readOnly" />
    </div>
  );
};

BooleanCell.propTypes = {
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired,
  setCellKeyboardShortcuts: PropTypes.func
};

export default pure(BooleanCell);
