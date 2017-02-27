import React from "react";
import Dispatcher from "../dispatcher/Dispatcher";
import TableauxConstants from "../constants/TableauxConstants";
import GenericOverlay from "./overlay/GenericOverlay.jsx";
import ViewRenderer from "./ViewRenderer.jsx";
import i18n from "i18next";
import XHR from "i18next-xhr-backend";
import {I18nextProvider} from "react-i18next";
import ActionCreator from "../actions/ActionCreator";
import Spinner from "./header/Spinner.jsx";
import Toast from "./overlay/Toast.jsx";
import * as f from "lodash/fp";

const ActionTypes = TableauxConstants.ActionTypes;

export default class Tableaux extends React.Component {
  static propTypes = {
    initialViewName: React.PropTypes.string.isRequired,
    initialParams: React.PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.currentLangtag = this.props.initialParams.langtag;

    Dispatcher.on(ActionTypes.OPEN_OVERLAY, this.openOverlay, this);
    Dispatcher.on(ActionTypes.CLOSE_OVERLAY, this.closeOverlay, this);
    Dispatcher.on(ActionTypes.SWITCH_VIEW, this.switchViewHandler, this);
    Dispatcher.on(ActionTypes.SHOW_TOAST, this.showToast, this);


    i18n
      .use(XHR)
      .init({
        // we need to define just 'en' otherwise fallback doesn't work correctly since i18next tries to load the
        // json only once with the exact fallbackLng Key. So 'en-GB' doesn't work because all
        fallbackLng: "en",
        lng: this.props.initialParams.langtag,

        // have a common namespace used around the full app
        ns: ["common", "header", "table", "media"],
        defaultNS: "common",

        debug: false,

        interpolation: {
          escapeValue: false // not needed for react!!
        }
      }, () => {
        this.setState({
          isLoading: false
        });
      });

    this.state = {
      currentView: this.props.initialViewName,
      currentViewParams: this.props.initialParams,
      activeOverlays: [],
      isLoading: true,
      toast: null
    };

    this.toastTimer = null;
  }

  componentWillUnmount() {
    Dispatcher.off(ActionTypes.OPEN_OVERLAY, this.openOverlay);
    Dispatcher.off(ActionTypes.CLOSE_OVERLAY, this.closeOverlay);
    Dispatcher.off(ActionTypes.SWITCH_VIEW, this.switchViewHandler);
  }

  switchViewHandler(payload) {
    console.log("switchViewHandler", payload);
    // check if language has changed
    if (this.currentLangtag !== payload.params.langtag) {
      ActionCreator.spinnerOn();
      i18n.changeLanguage(payload.params.langtag, () => {
        ActionCreator.spinnerOff();
        this.currentLangtag = payload.params.langtag;
        this.changeView(payload);
      });
    } else {
      this.changeView(payload);
    }
  }

  changeView(payload) {
    this.setState({
      currentView: payload.viewName,
      currentViewParams: payload.params
    });
  }

  openOverlay(content) {
    const {currentViewParams, activeOverlays} = this.state;
    this.setState({
      activeOverlays: [...activeOverlays, content],
      currentViewParams: f.assoc("overlayOpen", true, currentViewParams)
    });
  }

  closeOverlay() {
    const {currentViewParams, activeOverlays} = this.state;
    this.setState({
      activeOverlays: f.dropRight(1, activeOverlays),
      currentViewParams: f.assoc("overlayOpen", false, currentViewParams)
    });
  }

  renderActiveOverlays() {
    let overlays = this.state.activeOverlays;
    if (f.isEmpty(overlays)) {
      return null;
    }
    return overlays.map((overlay, idx) => {
      return (
        <GenericOverlay
          key={`genericoverlay-${idx}`}
          head={overlay.head}
          footer={overlay.footer}
          type={overlay.type}
          keyboardShortcuts={overlay.keyboardShortcuts}
          closeOnBackgroundClicked={overlay.closeOnBackgroundClicked}
          showBackButton={true}
        >
          {overlay.body}
        </GenericOverlay>
      );
    });
  }

  renderToast() {
    const {toast} = this.state;
    if (toast) {
      console.log("render toast");
      return (<Toast content={toast} />);
    }
  }

  // TODO: Stop hiding toast when user hovers over the toast message
  showToast(payload) {
    // default 1000ms
    const {content, milliseconds = 1000} = payload;

    this.setState({
      toast: content
    });

    if (this.toastTimer) {
      clearInterval(this.toastTimer);
    }

    this.toastTimer = setTimeout(this.hideToast, milliseconds);
  }

  hideToast = () => {
    this.toastTimer = null;
    this.setState({
      toast: null
    });
  };


  render() {
    if (this.state.isLoading) {
      return <div className="initial-loader"><Spinner isLoading={true} /></div>
    } else {
      return <I18nextProvider i18n={i18n}>
        <div id="tableaux-view">
          <ViewRenderer viewName={this.state.currentView} params={this.state.currentViewParams} />
          {this.renderActiveOverlays()}
          {this.renderToast()}
        </div>
      </I18nextProvider>;
    }
  }
}
