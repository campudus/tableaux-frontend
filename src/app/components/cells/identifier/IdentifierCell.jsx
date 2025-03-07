import React from "react";
import f from "lodash/fp";
import classNames from "classnames";

import PropTypes from "prop-types";

import { ColumnKinds } from "../../../constants/TableauxConstants";
import { isLocked } from "../../../helpers/annotationHelper";
import { openEntityView } from "../../overlay/EntityViewOverlay";
import { withForeignDisplayValues } from "../../helperComponents/withForeignDisplayValues";
import { format } from "../../../helpers/getDisplayValue";

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

  const className = classNames("cell-content", {
    "grey-out":
      cell.column.kind === ColumnKinds.group &&
      displayValue[langtag] === format(cell.column, "_")
  });

  return (
    <div className={className} onClick={openEditor}>
      {cell.column.kind === ColumnKinds.concat &&
      !f.isEmpty(foreignDisplayValues) &&
      !cell.column.formatPattern
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
