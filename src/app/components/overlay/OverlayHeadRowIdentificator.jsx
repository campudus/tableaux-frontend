import React from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { getColumnDisplayName } from "../../helpers/multiLanguage";
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
  const columnDisplayName = getColumnDisplayName(column, langtag);

  return (
    <span>
      <span className="column-name">{columnDisplayName}: </span>
      <RowConcat row={row} langtag={langtag} idColumn={f.first(columns)} />
    </span>
  );
};

OverlayHeadRowIdentificator.propTypes = {
  cell: PropTypes.object,
  langtag: PropTypes.string.isRequired
};

export default OverlayHeadRowIdentificator;
