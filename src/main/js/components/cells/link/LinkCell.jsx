import React from "react";
import PropTypes from "prop-types";
import LinkLabelCell from "./LinkLabelCell.jsx";
import LinkEditCell from "./LinkEditCell.jsx";
import * as f from "lodash/fp";
import {branch, compose, pure, renderComponent} from "recompose";

const LinkCell = (props) => {
  const {cell, langtag} = props;

  // Show a link preview for performance
  const tooManyLinks = f.size(cell.value) > 3;
  const links = f.take(3, cell.value)
    .map(
      (element, index) => (
        <LinkLabelCell key={element.id}
          linkElement={element}
          linkIndexAt={index}
          cell={cell}
          langtag={langtag}
          clickable={false}
        />
      )
    );
  return (
    <div className={"cell-content"}>
      {(tooManyLinks) ? [...links, <span key={"more"} className="more">&hellip;</span>] : links}
    </div>
  );
};

LinkCell.propTypes = {
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired,
  editing: PropTypes.bool.isRequired,
  setCellKeyboardShortcuts: PropTypes.func
};

export default compose(
  branch(
    ({editing, selected}) => selected || editing,
    renderComponent(LinkEditCell)
  ),
  pure
)(LinkCell);
