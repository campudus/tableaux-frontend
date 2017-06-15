import React from "react";
import {openEntityView} from "../../overlay/EntityViewOverlay";
import connectToAmpersand from "../../helperComponents/connectToAmpersand";

const IdentifierCell = (props) => {
  const {cell, langtag, selected} = props;
  return (
    <div className='cell-content' onClick={
      () => (selected)
        ? openEntityView(cell.row, langtag, null, null, cell.column)
        : function () {
        }
    }>
      {cell.displayValue[langtag]}
    </div>
  );
};

IdentifierCell.propTypes = {
  langtag: React.PropTypes.string.isRequired,
  cell: React.PropTypes.object.isRequired,
  editing: React.PropTypes.bool.isRequired,
  selected: React.PropTypes.bool.isRequired
};

module.exports = connectToAmpersand(IdentifierCell);
