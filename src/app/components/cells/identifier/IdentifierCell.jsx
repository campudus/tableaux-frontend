import f from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import { isLocked } from "../../../helpers/rowUnlock";
import T from "../../../helpers/table";
import { stripFormattingTags } from "../../helperComponents/FormattedLabel";
import { withForeignDisplayValues } from "../../helperComponents/withForeignDisplayValues";
import { openEntityView } from "../../overlay/EntityViewOverlay";

const IdentifierCell = props => {
  const {
    langtag,
    cell,
    editing,
    selected,
    foreignDisplayValues,
    displayValue
  } = props;
  const openEditor = () => {
    if ((selected || editing) && !isLocked(cell.row)) {
      openEntityView({
        langtag,
        table: cell.table,
        row: cell.row,
        filterColumn: cell.column
      });
    }
  };

  const label =
    !T.isUnionTable(cell.table) &&
    !f.isEmpty(foreignDisplayValues) &&
    !cell.column.formatPattern
      ? foreignDisplayValues
      : displayValue[langtag];

  return (
    <div className="cell-content" onClick={openEditor}>
      {stripFormattingTags(label)}
    </div>
  );
};

IdentifierCell.propTypes = {
  langtag: PropTypes.string.isRequired,
  cell: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  displayValue: PropTypes.object.isRequired
};

export default withForeignDisplayValues(IdentifierCell);
