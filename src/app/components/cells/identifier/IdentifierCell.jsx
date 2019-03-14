import React from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { ColumnKinds } from "../../../constants/TableauxConstants";
import { isLocked } from "../../../helpers/annotationHelper";
import { openEntityView } from "../../overlay/EntityViewOverlay";
import { withForeignDisplayValues } from "../../helperComponents/withForeignDisplayValues";

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
      {cell.column.kind === ColumnKinds.concat &&
      !f.isEmpty(foreignDisplayValues)
        ? foreignDisplayValues
        : displayValue[langtag]}
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
