import React from "react";
import PropTypes from "prop-types";
import { openEntityView } from "../../overlay/EntityViewOverlay";
import { isLocked } from "../../../helpers/annotationHelper";

const IdentifierCell = props => {
  const { langtag, cell, editing, selected, displayValue } = props;
  const openEditor = () => {
    (selected || editing) && !isLocked(cell.row)
      ? openEntityView({
          langtag,
          table: cell.table,
          row: cell.row,
          filterColumn: cell.column
        })
      : function() {};
  };

  return (
    <div className="cell-content" onClick={openEditor}>
      {displayValue[langtag]}
    </div>
  );
};

IdentifierCell.propTypes = {
  langtag: PropTypes.string.isRequired,
  cell: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  displayValue: PropTypes.object.isRequired
};

export default IdentifierCell;
