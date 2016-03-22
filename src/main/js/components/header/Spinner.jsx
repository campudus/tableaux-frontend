import React from 'react';
import Loader from 'react-loader';
import Dispatcher from '../../dispatcher/Dispatcher';
import TableauxConstants from '../../constants/TableauxConstants';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

const ActionTypes = TableauxConstants.ActionTypes;

export default class Spinner extends React.Component {

  static spinnerOptions = {
    lines : 11 // The number of lines to draw
    , length : 5 // The length of each line
    , width : 2 // The line thickness
    , radius : 4 // The radius of the inner circle
    , scale : 1 // Scales overall size of the spinner
    , corners : 1 // Corner roundness (0..1)
    , color : '#000' // #rgb or #rrggbb or array of colors
    , opacity : 0.0 // Opacity of the lines
    , rotate : 0 // The rotation offset
    , direction : 1 // 1: clockwise, -1: counterclockwise
    , speed : 1 // Rounds per second
    , trail : 60 // Afterglow percentage
    , fps : 20 // Frames per second when using setTimeout() as a fallback for CSS
    , zIndex : 1 // The z-index (defaults to 2000000000)
    , className : 'spinner' // The CSS class to assign to the spinner
    , top : '50%' // Top position relative to parent
    , left : '50%' // Left position relative to parent
    , shadow : false // Whether to render a shadow
    , hwaccel : true // Whether to use hardware acceleration
  };

  static propTypes = {};

  constructor(props) {
    super(props);
    Dispatcher.on(ActionTypes.SPINNER_ON, this.spinnerOn, this);
    Dispatcher.on(ActionTypes.SPINNER_OFF, this.spinnerOff, this);
    this.state = {isLoading : props.isLoading};
    this.spinnerElement = null;
  }

  shouldComponentUpdate(nextProps, nextState) {
    var shouldRenderStateUpdate = nextState.isLoading !== this.state.isLoading;
    return shouldRenderStateUpdate;
  }

  componentWillUnmount() {
    Dispatcher.off(ActionTypes.SPINNER_ON, this.spinnerOn, this);
    Dispatcher.off(ActionTypes.SPINNER_OFF, this.spinnerOff, this);
  }

  spinnerOn() {
    this.setState({isLoading : true});
  }

  spinnerOff() {
    this.setState({isLoading : false});
  }

  renderSpinner() {
    if (this.state.isLoading) {
      this.spinnerElement = this.spinnerElement ||
        <Loader loaded={false} options={Spinner.spinnerOptions} className="actual-spinner"/>;
      return (
        <div key="spinnerWrapper" className="spinner">
          {this.spinnerElement}
        </div>
      );
    } else {
      return null;
    }
  }

  render() {
    return (
      <div id="Tableaux-Spinner">
        <ReactCSSTransitionGroup transitionName="spinner" transitionEnterTimeout={750} transitionLeaveTimeout={300}>
          {this.renderSpinner()}
        </ReactCSSTransitionGroup>
      </div>
    )
  }
}

Spinner.propTypes = {isLoading : React.PropTypes.bool};
Spinner.defaultProps = {isLoading : false};