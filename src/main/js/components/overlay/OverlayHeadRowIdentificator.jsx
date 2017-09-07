import React, {PropTypes} from "react";
import RowConcat from "../../helpers/RowConcatHelper";
import {pure} from "recompose";
import connectToAmpersand from "../helperComponents/connectToAmpersand";

const OverlayHeadRowIdentificator = (props) => {
  const {cell, cell: {column}, langtag} = props;
  if (!cell) {
    return null;
  }
  const rowIdentification = <RowConcat row={cell.row} langtag={langtag} />;
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

export default pure(connectToAmpersand(OverlayHeadRowIdentificator));
