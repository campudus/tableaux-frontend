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
  const currentLangDisplayValues = useMemo(() => {
    if (!displayValue) return [];
    return f.map(
      dv =>
        f.isArray(dv)
          ? f.join(" > ", f.compact(f.map(f.get(langtag), dv))) // taxonomy link with multiple displayValues
          : f.get(langtag, dv),
      displayValue
    );
  }, [displayValue, langtag]);

  const previewLinkCount = useMemo(() => {
    return getVisibleLinkCount(currentLangDisplayValues, width);
  }, [currentLangDisplayValues, width]);

  const isEditOrSelect = editing || selected;
  const hasMore = f.size(value) > previewLinkCount;
  const linkValues = isEditOrSelect ? value : f.take(previewLinkCount, value);
  const links = linkValues.map((element, index) => (
    <LinkLabelCell
      key={element.id}
      value={element}
      langtag={langtag}
      displayValue={currentLangDisplayValues[index]}
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
        {links}
        {hasMore && !isEditOrSelect && (
          <span key={"more"} className="more">
            &hellip;
          </span>
        )}
      </div>
      {(selected || editing) && !isLocked(cell.row) && (
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
