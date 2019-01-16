import React from "react";
import PropTypes from "prop-types";
import RowConcat from "../../helpers/RowConcatHelper";

const OverlayHeadRowIdentificator = props => {
  const {
    cell,
    cell: { row, column, columns },
    langtag
  } = props;
  if (!cell) {
    return null;
  }
  const columnDisplayName = column.displayName[langtag] || column.name;

  return (
    <span>
      <span className="column-name">{columnDisplayName}: </span>
      <RowConcat row={row} langtag={langtag} idColumn={columns[0]} />
    </span>
  );
};

OverlayHeadRowIdentificator.propTypes = {
  cell: PropTypes.object,
  langtag: PropTypes.string.isRequired
};

export default OverlayHeadRowIdentificator;
