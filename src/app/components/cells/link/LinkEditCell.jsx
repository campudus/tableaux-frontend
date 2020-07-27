import { compose, withHandlers } from "recompose";
import React from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { canUserChangeCell } from "../../../helpers/accessManagementHelper";
import { isLocked } from "../../../helpers/annotationHelper";
import { openLinkOverlay } from "./LinkOverlay.jsx";
import { spy } from "../../../helpers/functools";
import { withForeignDisplayValues } from "../../helperComponents/withForeignDisplayValues";
import LinkLabelCell from "./LinkLabelCell.jsx";

const withOverlayOpener = compose(
  withHandlers({
    catchScrolling: () => event => {
      event && event.stopPropagation();
    },
    openOverlay: ({ cell, langtag, actions }) => () => {
      if (canUserChangeCell(cell, langtag) && !isLocked(cell.row)) {
        openLinkOverlay({ cell, langtag, actions });
      }
    }
  }),
  withForeignDisplayValues
);

const LinkEditCell = props => {
  const {
    cell,
    langtag,
    foreignDisplayValues,
    value,
    openOverlay,
    catchScrolling
  } = props;

  const displayValue = foreignDisplayValues || props.displayValue;

  const links = f.isArray(value)
    ? value.map((element, index) => (
        <LinkLabelCell
          key={element.id}
          linkElement={element}
          cell={cell}
          langtag={langtag}
          displayValue={displayValue[index]}
          value={element}
        />
      ))
    : spy(
        [],
        "Cell value was not array but " +
          typeof cell.value +
          " " +
          JSON.stringify(cell.value)
      );

  return (
    <div
      className={"cell-content"}
      onScroll={catchScrolling}
      onClick={openOverlay}
    >
      {canUserChangeCell(cell, langtag)
        ? [
            ...links,
            <button key={"add-btn"} className="edit">
              <span className="fa fa-pencil" />
            </button>
          ]
        : links}
    </div>
  );
};

LinkEditCell.propTypes = {
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  editing: PropTypes.bool.isRequired
};

export default withOverlayOpener(LinkEditCell);
