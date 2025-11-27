import classNames from "classnames";
import f from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import { ColumnKinds } from "../../../constants/TableauxConstants";
import { format } from "../../../helpers/getDisplayValue";
import { isLocked } from "../../../helpers/rowUnlock";
import T from "../../../helpers/table";
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

  const className = classNames("cell-content", {
    "grey-out":
      cell.column.kind === ColumnKinds.group &&
      displayValue[langtag] === format(cell.column, "_")
  });

  return (
    <div className={className} onClick={openEditor}>
      {cell.column.kind === ColumnKinds.concat &&
      !T.isUnionTable(cell.table) &&
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
