import React from "react";
import Loader from "react-loader";
import { CSSTransition } from "react-transition-group";
import { merge } from "lodash/fp";
import PropTypes from "prop-types";

class Spinner extends React.Component {
  static spinnerOptions = {
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

  static propTypes = {};

  constructor(props) {
    super(props);
    this.state = { isLoading: props.isLoading };
    this.spinnerElement = null;
  }

  shouldComponentUpdate(nextProps, nextState) {
    const shouldRenderStateUpdate =
      nextState.isLoading !== this.state.isLoading;
    return shouldRenderStateUpdate;
  }

  spinnerOn() {
    this.setState({ isLoading: true });
  }

  spinnerOff() {
    this.setState({ isLoading: false });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.isLoading !== this.props.isLoading) {
      this.setState({ isLoading: nextProps.isLoading });
    }
  }

  renderSpinner() {
    if (this.state.isLoading) {
      const { customOptions } = this.props;
      const options = customOptions
        ? merge(Spinner.spinnerOptions, customOptions)
        : Spinner.spinnerOptions;
      this.spinnerElement = this.spinnerElement || (
        <Loader loaded={false} options={options} className="actual-spinner" />
      );
      return (
        <div key="spinnerWrapper" className="spinner">
          {this.spinnerElement}
        </div>
      );
    } else {
      return <div />;
    }
  }

  render() {
    return (
      <div className="Tableaux-Spinner">
        <CSSTransition classNames="spinner" timeout={{ exit: 300, enter: 750 }}>
          {this.renderSpinner()}
        </CSSTransition>
      </div>
    );
  }
}

export default Spinner;
export const LoadingSpinner = props => <Spinner {...props} isLoading />;

Spinner.propTypes = {
  isLoading: PropTypes.bool,
  customOptions: PropTypes.object
};
Spinner.defaultProps = { isLoading: false };
