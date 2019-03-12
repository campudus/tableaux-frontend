import React from "react";
import PropTypes from "prop-types";
import { openLinkOverlay } from "./LinkOverlay.jsx";
import LinkLabelCell from "./LinkLabelCell.jsx";
import { isLocked } from "../../../helpers/annotationHelper";
import { isUserAdmin } from "../../../helpers/accessManagementHelper";
import { compose, withHandlers } from "recompose";
import f from "lodash/fp";
import { spy } from "../../../helpers/functools";

const withOverlayOpener = compose(
  withHandlers({
    catchStrolling: () => event => {
      event && event.stopPropagation();
    },
    openOverlay: ({ cell, langtag, actions }) => () => {
      if (isUserAdmin() && !isLocked(cell.row)) {
        openLinkOverlay({ cell, langtag, actions });
      }
    }
  })
);

const LinkEditCell = props => {
  const {
    cell,
    langtag,
    displayValue,
    allDisplayValues,
    value,
    openOverlay,
    catchScrolling
  } = props;

  const links = f.isArray(value)
    ? value.map((element, index) => (
        <LinkLabelCell
          key={element.id}
          linkElement={element}
          cell={cell}
          langtag={langtag}
          displayValue={displayValue[index]}
          value={element}
          displayValues={allDisplayValues[cell.column.toTable]}
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
      {[
        ...links,
        <button key={"add-btn"} className="edit">
          <span className="fa fa-pencil" />
        </button>
      ]}
    </div>
  );
};

LinkEditCell.propTypes = {
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  editing: PropTypes.bool.isRequired
};

export default withOverlayOpener(LinkEditCell);
