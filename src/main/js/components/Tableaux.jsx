import React from 'react';
import App from 'ampersand-app';
import Dispatcher from '../dispatcher/Dispatcher';
import TableauxConstants from '../constants/TableauxConstants';

import GenericOverlay from './overlay/GenericOverlay.jsx';
import ViewRenderer from './ViewRenderer.jsx';

import i18n from 'i18next/lib';
import XHR from 'i18next-xhr-backend/lib';
import { I18nextProvider } from 'react-i18next/lib';

const ActionTypes = TableauxConstants.ActionTypes;

export default class Tableaux extends React.Component {

  state = {
    currentView : this.props.initialViewName,
    currentViewParams : this.props.initialParams,
    activeOverlay : null,
    isLoading : true
  };

  static propTypes = {
    initialViewName : React.PropTypes.string.isRequired,
    initialParams : React.PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.currentLangtag = this.props.initialParams.langtag;
    //register listeners
    Dispatcher.on(ActionTypes.OPEN_OVERLAY, this.openOverlay, this);
    Dispatcher.on(ActionTypes.CLOSE_OVERLAY, this.closeOverlay, this);
    Dispatcher.on(ActionTypes.SWITCH_VIEW, this.switchViewHandler, this);

    i18n
      .use(XHR)
      .init({
        fallbackLng : App.defaultLangtag,
        lng : this.props.initialParams.langtag,

        // have a common namespace used around the full app
        ns : ['common', 'header'],
        defaultNS : 'common',

        debug : true,

        interpolation : {
          escapeValue : false // not needed for react!!
        }
      }, () => {
        this.setState({
          isLoading : false
        });
      });
  }

  componentWillUnmount() {
    Dispatcher.off(ActionTypes.OPEN_OVERLAY, this.openOverlay);
    Dispatcher.off(ActionTypes.CLOSE_OVERLAY, this.closeOverlay);
    Dispatcher.off(ActionTypes.SWITCH_VIEW, this.switchViewHandler);
  }

  switchViewHandler(payload) {
    console.log('switchViewHandler', payload);
    //check if language has changed
    if (this.currentLangtag !== payload.params.langtag) {
      i18n.changeLanguage(payload.params.langtag, () => {
        this.currentLangtag = payload.params.langtag;
        this.changeView(payload);
      });
    } else {
      this.changeView(payload);
    }
  }

  changeView(payload) {
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
    if (this.state.isLoading) {
      return <div className="spinner">Loading</div>
    } else {
      return <I18nextProvider i18n={i18n}>
        <div id="tableaux-view">
          <ViewRenderer viewName={this.state.currentView} params={this.state.currentViewParams}/>
          {this.renderActiveOverlay()}
        </div>
      </I18nextProvider>;
    }
  }
}