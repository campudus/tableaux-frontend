import React from "react";
import PropTypes from "prop-types";
import { isEmpty } from "lodash/fp";

const DisabledCell = props =>
  // <div className="cell-content">{isEmpty(props.value) ? "" : props.value}</div>
  null;

DisabledCell.propTypes = {
  langtag: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired
};

export default DisabledCell;
