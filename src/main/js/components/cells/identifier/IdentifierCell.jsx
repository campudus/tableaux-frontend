import React, {PropTypes} from "react";
import {openEntityView} from "../../overlay/EntityViewOverlay";
import connectToAmpersand from "../../helperComponents/connectToAmpersand";
import {isLocked} from "../../../helpers/annotationHelper";

const IdentifierCell = (props) => {
  const {cell, editing, langtag, selected, setCellKeyboardShortcuts} = props;
  const openEditor = () => ((selected || editing) && !isLocked(cell.row))
    ? openEntityView(cell.row, langtag, null, null, cell.column)
    : function () {};
  setCellKeyboardShortcuts({
    enter: openEditor
  });
  return (
    <div className='cell-content' onClick={openEditor}>
      {cell.displayValue[langtag]}
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

module.exports = connectToAmpersand(IdentifierCell);
