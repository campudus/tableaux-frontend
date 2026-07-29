import React, { useMemo } from "react";
import * as f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";
import { compose, lifecycle } from "recompose";

import { withForeignDisplayValues } from "../../helperComponents/withForeignDisplayValues";
import LinkLabelCell from "./LinkLabelCell.jsx";
import {
  cellReservedWidth,
  getVisibleLinkCount,
  linkReservedWidth
} from "./getVisibleLinkCount";
import { isLocked } from "../../../helpers/rowUnlock";
import { canUserChangeCell } from "../../../helpers/accessManagementHelper";
import { openLinkOverlay } from "./LinkOverlay";
import { retrieveTranslation } from "../../../helpers/multiLanguage";

// .link-label has a CSS max-width of 90% of .cell-content, so a single
// label's own text can never claim the full reserved width, regardless of
// how much room the cell actually has.
const LINK_LABEL_MAX_WIDTH_RATIO = 0.9;

// Resolves each linked row's displayValue to the current language. A
// taxonomy link's displayValue is an array of {langtag: text} path nodes
// instead of a single one, so it resolves to an array of node texts.
const resolveCurrentLangDisplayValues = (displayValue, langtag) => {
  const emptyValue = `(${i18n.t("common:empty").toUpperCase()})`;
  if (!displayValue) return [];
  return f.map(
    dv =>
      f.isArray(dv)
        ? f.map(dv => retrieveTranslation(langtag, dv) || emptyValue, dv)
        : f.get(langtag, dv),
    displayValue
  );
};

const getAvailableLinkLabelWidth = width =>
  (width - cellReservedWidth - linkReservedWidth) * LINK_LABEL_MAX_WIDTH_RATIO;

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
  const currentLangDisplayValues = useMemo(
    () => resolveCurrentLangDisplayValues(displayValue, langtag),
    [displayValue, langtag]
  );

  const previewLinkCount = useMemo(
    () => getVisibleLinkCount(currentLangDisplayValues, width),
    [currentLangDisplayValues, width]
  );

  const availableWidth = getAvailableLinkLabelWidth(width);
  const isEditOrSelect = editing || selected;
  const hasMore = f.size(value) > previewLinkCount;
  const linkValues = isEditOrSelect ? value : f.take(previewLinkCount, value);
  const links = linkValues.map((element, index) => (
    <LinkLabelCell
      key={element.id}
      value={element}
      langtag={langtag}
      displayValue={currentLangDisplayValues[index]}
      availableWidth={availableWidth}
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
