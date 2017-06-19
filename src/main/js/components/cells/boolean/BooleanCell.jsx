import React, {PropTypes} from "react";
import ActionCreator from "../../../actions/ActionCreator";
import connectToAmpersand from "../../helperComponents/connectToAmpersand";
import {isLocked} from "../../../helpers/annotationHelper";
import askForSessionUnlock from "../../helperComponents/SessionUnlockDialog";

const BooleanCell = (props) => {
  const {cell, langtag, selected, setCellKeyboardShortcuts} = props;

  const handleEditDone = (newValue) => {
    const valueToSave = (cell.isMultiLanguage)
      ? {[langtag]: newValue}
      : newValue;
    ActionCreator.changeCell(cell, valueToSave);
  };

  const getCheckboxValue = () => {
    return !!((cell.isMultiLanguage) ? cell.value[langtag] : cell.value);
  };

  const toggleCheckboxValue = () => {
    if (isLocked(cell.row)) {
      askForSessionUnlock(cell.row);
      return;
    } else if (selected) {
      handleEditDone(!getCheckboxValue());
    }
  };

  setCellKeyboardShortcuts({
    enter: evt => {
      toggleCheckboxValue();
    }
  });
  
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

export default connectToAmpersand(BooleanCell);
