import React from "react";
import PropTypes from "prop-types";

const ExpandButton = props => {
  return (
    <button className="expand" onMouseDown={props.onTrigger}>
      <span className="fa fa-expand" />
    </button>
  );
};

ExpandButton.propTypes = {
  onTrigger: PropTypes.func.isRequired
};

export default ExpandButton;
