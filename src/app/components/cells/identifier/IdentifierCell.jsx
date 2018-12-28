import React from "react";
import PropTypes from "prop-types";
// import {openEntityView} from "../../overlay/EntityViewOverlay";
// import connectToAmpersand from "../../helperComponents/connectToAmpersand";
import {isLocked} from "../../../helpers/annotationHelper";

const IdentifierCell = props => {
  const {value,column, langtag, editing, selected, displayValue} = props;
  const openEditor = () => {
    (selected || editing) && !isLocked(cell.row)
      ? function() {} //openEntityView(cell.row, langtag, null, null, cell.column)
      : function() {};
  };

  return (
    <div className="cell-content" onClick={openEditor}>
      {displayValue[langtag]}
    </div>
  );
};

export default IdentifierCell;
