import React from "react";
import * as f from "lodash/fp";

import PropTypes from "prop-types";

import LinkEditCell from "./LinkEditCell.jsx";
import LinkLabelCell from "./LinkLabelCell.jsx";

const LinkCell = props => {
  const {
    cell,
    value,
    langtag,
    selected,
    editing,
    displayValue,
    allDisplayValues
  } = props;

  // Show a link preview for performance
  // const displayValues = getDisplayValue(column, value);
  const tooManyLinks = f.size(value) > 3;
  const links = f
    .take(3, value)
    .map((element, index) => (
      <LinkLabelCell
        key={element.id}
        value={element}
        langtag={langtag}
        displayValue={displayValue[index]}
        displayValues={allDisplayValues[cell.column.toTable]}
        cell={cell}
      />
    ));

  return selected || editing ? (
    <LinkEditCell {...props} />
  ) : (
    <div className={"cell-content"}>
      {tooManyLinks
        ? [
            ...links,
            <span key={"more"} className="more">
              &hellip;
            </span>
          ]
        : links}
    </div>
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
export default LinkCell;
