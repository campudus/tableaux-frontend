import React from 'react';
import Dispatcher from '../dispatcher/Dispatcher';
import TableauxConstants from '../constants/TableauxConstants';

import GenericOverlay from './overlay/GenericOverlay.jsx';
import ViewRenderer from './ViewRenderer.jsx';

const ActionTypes = TableauxConstants.ActionTypes;

export default class Tableaux extends React.Component {

  state = {
    currentView : this.props.initialViewName,
    currentViewParams : this.props.initialParams,
    activeOverlay : null
  };

  static propTypes = {
    initialViewName : React.PropTypes.string.isRequired,
    initialParams : React.PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    //register listeners
    Dispatcher.on(ActionTypes.OPEN_OVERLAY, this.openOverlay, this);
    Dispatcher.on(ActionTypes.CLOSE_OVERLAY, this.closeOverlay, this);
    Dispatcher.on(ActionTypes.SWITCH_VIEW, this.switchViewHandler, this);
  }

  componentWillUnmount() {
    Dispatcher.off(ActionTypes.OPEN_OVERLAY, this.openOverlay);
    Dispatcher.off(ActionTypes.CLOSE_OVERLAY, this.closeOverlay);
    Dispatcher.off(ActionTypes.SWITCH_VIEW, this.switchViewHandler);
  }

  switchViewHandler(payload) {
    console.log('switchViewHandler', payload);
    this.setState({
      currentView : payload.viewName,
      currentViewParams : payload.params
    });
  }

  openOverlay(content) {
    this.setState({activeOverlay : content});
  }

  closeOverlay() {
    this.setState({activeOverlay : null});
  }

  renderActiveOverlay() {
    let overlay = this.state.activeOverlay;
    if (overlay) {
      return (<GenericOverlay key="genericoverlay"
                              head={overlay.head}
                              body={overlay.body}
                              footer={overlay.footer}
                              type={overlay.type}
                              closeOnBackgroundClicked={overlay.closeOnBackgroundClicked}
      />);
    }
  }

  render() {
    return <div id="tableaux-view">
      <ViewRenderer viewName={this.state.currentView} params={this.state.currentViewParams}/>
      {this.renderActiveOverlay()}
    </div>;
  }
}