import PropTypes from "prop-types";
import React, { useCallback, useEffect } from "react";
import { canUserChangeCell } from "../../../helpers/accessManagementHelper";
import { isLocked } from "../../../helpers/annotationHelper";
import { withForeignDisplayValues } from "../../helperComponents/withForeignDisplayValues";
import LinkLabelCell from "./LinkLabelCell.jsx";
import { openLinkOverlay } from "./LinkOverlay.jsx";

const LinkEditCell = props => {
  const {
    cell,
    editing,
    langtag,
    foreignDisplayValues,
    value,
    actions
  } = props;

  const catchScrolling = useCallback(event => {
    event && event.stopPropagation();
  }, []);
  const displayValue = foreignDisplayValues || props.displayValue;

  const links = value.map((element, index) => (
    <LinkLabelCell
      key={element.id}
      linkElement={element}
      cell={cell}
      langtag={langtag}
      displayValue={displayValue[index]}
      value={element}
    />
  ));

  useEffect(() => {
    if (editing && canUserChangeCell(cell, langtag) && !isLocked(cell.row)) {
      openLinkOverlay({ cell, langtag, actions });
      actions.toggleCellEditing({ editing: false });
    }
  }, [Boolean(editing), isLocked(cell.row)]);

  return (
    <>
      <div className={"cell-content"} onScroll={catchScrolling}>
        {links}
      </div>
      {canUserChangeCell(cell, langtag) && (
        <button key={"add-btn"} className="edit">
          <span className="fa fa-pencil" />
        </button>
      )}
    </>
  );
};

LinkEditCell.propTypes = {
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  editing: PropTypes.bool.isRequired
};

export default withForeignDisplayValues(LinkEditCell);
