import React from "react";
import PropTypes from "prop-types";
import f from "lodash/fp";
import {pure} from "recompose";

const ProgressBar = ({progress}) => {
  const completed = f.clamp(0, 100, progress);

  const style = {
    width: `{completed}%`,
    transition: "width 100ms"
  };

  return (
    <div className="progressbar-container">
      <div className="progressbar-progress" style={style}>{completed + "%"}</div>
    </div>
  );
};

ProgressBar.propTypes = {
  progress: PropTypes.number.isRequired
};

export default pure(ProgressBar);

