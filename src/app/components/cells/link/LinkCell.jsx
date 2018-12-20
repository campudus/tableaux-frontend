import React from "react";
import PropTypes from "prop-types";
import LinkLabelCell from "./LinkLabelCell.jsx";
import LinkEditCell from "./LinkEditCell.jsx";
import * as f from "lodash/fp";

const LinkCell = props => {
  const {value, langtag, selected, editing, column, displayValue} = props;

  // Show a link preview for performance
  // const displayValues = getDisplayValue(column, value);
  const tooManyLinks = f.size(value) > 3;
  const links = f
    .take(3, value)
    .map((element, index) => (
      <LinkLabelCell
        key={element.id}
        linkElement={element}
        linkIndexAt={index}
        value={element}
        langtag={langtag}
        clickable={false}
        displayValue={displayValue[index]}
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

// LinkCell.propTypes = {
//   cell: PropTypes.object.isRequired,
//   langtag: PropTypes.string.isRequired,
//   selected: PropTypes.bool.isRequired,
//   editing: PropTypes.bool.isRequired,
//   setCellKeyboardShortcuts: PropTypes.func
// };
export default LinkCell;

// export default compose(
//   branch(
//     ({editing, selected}) => selected || editing,
//     renderComponent(LinkEditCell)
//   ),
//   pure
// )(LinkCell);
