import React from "react";
import * as f from "lodash/fp";

import PropTypes from "prop-types";
import { compose, lifecycle } from "recompose";

import { withForeignDisplayValues } from "../../helperComponents/withForeignDisplayValues";
import LinkEditCell from "./LinkEditCell.jsx";
import LinkLabelCell from "./LinkLabelCell.jsx";

const LinkCell = props => {
  const {
    cell,
    value,
    langtag,
    selected,
    editing,
    foreignDisplayValues
  } = props;

  const displayValue = foreignDisplayValues || props.displayValue;
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
