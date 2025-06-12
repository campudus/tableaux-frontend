import React, { useMemo } from "react";
import * as f from "lodash/fp";

import PropTypes from "prop-types";
import { compose, lifecycle } from "recompose";

import { withForeignDisplayValues } from "../../helperComponents/withForeignDisplayValues";
import LinkLabelCell from "./LinkLabelCell.jsx";
import { getVisibleLinkCount } from "./getVisibleLinkCount";
import { isLocked } from "../../../helpers/rowUnlock";
import { canUserChangeCell } from "../../../helpers/accessManagementHelper";
import { openLinkOverlay } from "./LinkOverlay";

const LinkCell = props => {
  const {
    cell,
    value,
    langtag,
    selected,
    editing,
    foreignDisplayValues,
    width,
    actions
  } = props;

  const displayValue = foreignDisplayValues || props.displayValue;
  const previewLinkCount = useMemo(() => {
    const currentLangDisplayValues = f.map(f.get(langtag), displayValue);
    return getVisibleLinkCount(currentLangDisplayValues, width);
  }, [width]);

  // Show a link preview for performance
  // const displayValues = getDisplayValue(column, value);
  const tooManyLinks = f.size(value) > previewLinkCount;
  const links = f
    .take(previewLinkCount, value)
    .map((element, index) => (
      <LinkLabelCell
        key={element.id}
        value={element}
        langtag={langtag}
        displayValue={displayValue[index]}
        cell={cell}
      />
    ));

  const handleClick = e => {
    if (
      !isLocked(cell.row) &&
      canUserChangeCell(cell, langtag) &&
      (editing || selected)
    ) {
      openLinkOverlay({ cell, langtag, actions });
    }
  };

  return (
    <>
      <div className={"cell-content"} onClick={handleClick}>
        {tooManyLinks
          ? [
              ...links,
              <span key={"more"} className="more">
                &hellip;
              </span>
            ]
          : links}
      </div>
      {(selected || editing) && (
        <button key={"add-btn"} className="edit" onClick={handleClick}>
          <span className="fa fa-pencil" />
        </button>
      )}
    </>
  );
};

LinkCell.propTypes = {
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired,
  editing: PropTypes.bool.isRequired,
  displayValues: PropTypes.array,
  value: PropTypes.array.isRequired,
  setCellKeyboardShortcuts: PropTypes.func
};
export default compose(
  withForeignDisplayValues,
  lifecycle({
    shouldComponentUpdate(nextProps) {
      const cell = this.props.cell;
      const nextCell = nextProps.cell;
      const getRelevantCellProps = f.pick(["value", "annotations"]);

      return (
        this.props.langtag !== nextProps.langtag ||
        cell.id !== nextCell.id ||
        this.props.selected !== nextProps.selected ||
        this.props.inSelectedRow !== nextProps.inSelectedRow ||
        this.props.editing !== nextProps.editing ||
        this.props.annotationsOpen !== nextProps.annotationsOpen ||
        this.props.foreignDisplayValues !== nextProps.foreignDisplayValues ||
        !f.isEqual(
          getRelevantCellProps(this.props.cell),
          getRelevantCellProps(nextProps.cell)
        )
      );
    }
  })
)(LinkCell);
