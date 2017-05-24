import React, {PropTypes} from "react";
import {loadAndOpenEntityView} from "../../overlay/EntityViewOverlay";

const LinkLabelCell = props => {
  const {cell, clickable, langtag, linkElement, linkIndexAt} = props;
  const getLinkName = () => {
    return cell.displayValue[linkIndexAt][langtag];
  };

  const tableId = cell.column.toTable;
  const rowId = linkElement.id;

  const clickFn = evt => {
    loadAndOpenEntityView({
      tables: cell.tables,
      tableId,
      rowId
    }, langtag);
    evt.stopPropagation();
  };

  return <a href="#" onClick={(clickable) ? clickFn : () => {
  }} className="link-label">
    <div className="label-text">{getLinkName()}</div>
  </a>;
};

LinkLabelCell.propTypes = {
  cell: PropTypes.object.isRequired,
  linkElement: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,

  // Used for performance reason to get cached derived value from the cell model
  linkIndexAt: PropTypes.number.isRequired,

  // clickable label (optional)
  clickable: PropTypes.bool
};

module.exports = LinkLabelCell;
