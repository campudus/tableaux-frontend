import { merge } from "lodash/fp";
import Loader from "react-loader";
import React from "react";

import { CSSTransition } from "react-transition-group";
import PropTypes from "prop-types";

const spinnerDefaults = {
  lines: 11, // The number of lines to draw
  length: 5, // The length of each line
  width: 2, // The line thickness
  radius: 4, // The radius of the inner circle
  scale: 1, // Scales overall size of the spinner
  corners: 1, // Corner roundness (0..1)
  color: "#000", // #rgb or #rrggbb or array of colors
  opacity: 0.0, // Opacity of the lines
  rotate: 0, // The rotation offset
  direction: 1, // 1: clockwise, -1: counterclockwise
  speed: 1, // Rounds per second
  trail: 60, // Afterglow percentage
  fps: 20, // Frames per second when using setTimeout() as a fallback for CSS
  zIndex: 1, // The z-index (defaults to 2000000000)
  className: "spinner", // The CSS class to assign to the spinner
  top: "50%", // Top position relative to parent
  left: "50%", // Left position relative to parent
  shadow: false, // Whether to render a shadow
  hwaccel: true // Whether to use hardware acceleration
};

const Spinner = ({ isLoading, customOptions = {} }) => {
  const options = merge(spinnerDefaults, customOptions);
  return (
    <div className="Tableaux-Spinner">
      <CSSTransition className="spinner" timeout={{ exit: 300, enter: 750 }}>
        <div id="spinnerWrapper" className="spinner">
          {isLoading && <Loader className="actual-spinner" options={options} />}
        </div>
      </CSSTransition>
    </div>
  );
};

export default Spinner;
export const LoadingSpinner = props => <Spinner {...props} isLoading />;

Spinner.propTypes = {
  isLoading: PropTypes.bool,
  customOptions: PropTypes.object
};
Spinner.defaultProps = { isLoading: false };
