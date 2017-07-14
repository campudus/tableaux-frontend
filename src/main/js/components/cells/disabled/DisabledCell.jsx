import React, {PropTypes} from "react";

const DisabledCell = (props) => {

  const {cell, langtag, selected} = props;

  const getValue = () => {
    let value;
    if (cell.isMultiLanguage) {
      value = cell.value[langtag];
    } else {
      value = cell.value;
    }

    return typeof value === "undefined" ? "" : value;
  };

  const value = getValue();

  return (
    <div className='cell-content'>
      {value === null ? "" : value}
    </div>
  );
};

DisabledCell.propTypes = {
  langtag: PropTypes.string.isRequired,
  cell: PropTypes.object.isRequired,
  selected: PropTypes.bool.isRequired
};

export default DisabledCell;
