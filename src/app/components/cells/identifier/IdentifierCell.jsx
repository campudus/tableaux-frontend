import React from "react";
import PropTypes from "prop-types";
// import {openEntityView} from "../../overlay/EntityViewOverlay";
// import connectToAmpersand from "../../helperComponents/connectToAmpersand";
import {isLocked} from "../../../helpers/annotationHelper";

const IdentifierCell = props => {
  const {value,column, langtag, editing, selected} = props;
  const displayValue = value[0] + " " + value[1]["en-GB"];
  const openEditor = () => {
    (selected || editing) && !isLocked(cell.row)
      ? function() {} //openEntityView(cell.row, langtag, null, null, cell.column)
      : function() {};
  };

  return (
    <div className="cell-content" onClick={openEditor}>
      {displayValue}
    </div>
  );
};

IdentifierCell.propTypes = {
  langtag: PropTypes.string.isRequired,
  cell: PropTypes.object.isRequired,
  editing: PropTypes.bool.isRequired,
  selected: PropTypes.bool.isRequired,
  setCellKeyboardShortcuts: PropTypes.func.isRequired
};

export default IdentifierCell;
