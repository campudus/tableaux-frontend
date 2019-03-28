import React from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { ColumnKinds } from "../../constants/TableauxConstants";
import {
  getColumnDisplayName,
  retrieveTranslation
} from "../../helpers/multiLanguage";
import { withForeignDisplayValues } from "../helperComponents/withForeignDisplayValues";
import RowConcat from "../../helpers/RowConcatHelper";

const OverlayHeadRowIdentificator = props => {
  const {
    cell,
    cell: { row, column, columns },
    langtag,
    foreignDisplayValues
  } = props;
  if (!cell) {
    return null;
  }
  const columnDisplayName = getColumnDisplayName(column, langtag);

  const isConcatCell =
    !f.isNil(foreignDisplayValues) && column.kind === ColumnKinds.concat;
  const isLinkCell =
    !f.isNil(foreignDisplayValues) && column.kind === ColumnKinds.link;
  const concatValue = isConcatCell ? (
    foreignDisplayValues
  ) : isLinkCell ? (
    foreignDisplayValues.map(retrieveTranslation(langtag)).join(" ")
  ) : (
    <RowConcat row={row} langtag={langtag} idColumn={f.first(columns)} />
  );

  return (
    <span>
      <span className="column-name">
        {columnDisplayName}
        {f.any(f.isEmpty, [columnDisplayName, concatValue]) ? "" : ": "}
      </span>
      {f.isString(concatValue) ? (
        <span className="row-concat-string">{concatValue}</span>
      ) : (
        concatValue
      )}
    </span>
  );
};

OverlayHeadRowIdentificator.propTypes = {
  cell: PropTypes.object,
  langtag: PropTypes.string.isRequired
};

export default withForeignDisplayValues(OverlayHeadRowIdentificator);
