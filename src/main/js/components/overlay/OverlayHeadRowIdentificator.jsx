import React, {PropTypes} from "react";
import Empty from "../helperComponents/emptyEntry";
import * as f from "lodash/fp";

const OverlayHeadRowIdentificator = (props) => {
  const {cell, cell: {column}, langtag} = props;
  if (!cell) {
    return null;
  }

  const identifierCell = cell.row.cells.at(0);
  const rowIdentifierString = identifierCell.displayValue[langtag];

  const rowIdentification = (f.isEmpty(rowIdentifierString))
    ? <Empty />
    : <span className="row-identification-value">{rowIdentifierString}</span>;

  const columnDisplayName = column.displayName[langtag] || column.name;

  if (cell.isLink) {
    // TODO link to table?
    return (
      <span>
          <span className="column-name">
            {columnDisplayName}:{" "}
          </span>
        {rowIdentification}
        </span>
    );
  } else {
    return (
      <span>
          <span className="column-name">
            {columnDisplayName}:{" "}
          </span>
        {rowIdentification}
        </span>
    );
  }
};

OverlayHeadRowIdentificator.propTypes = {
  cell: PropTypes.object,
  langtag: PropTypes.string.isRequired
};

export default OverlayHeadRowIdentificator;
