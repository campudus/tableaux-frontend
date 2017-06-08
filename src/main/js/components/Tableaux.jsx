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
import RootButton from "./RootButton";

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
      exitingOverlays: false,
      isLoading: true,
      toast: null
    };

    this.toastTimer = null;
    this.exitingOverlays = [];
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
    const timestamp = new Date().getTime();
    this.setState({
      activeOverlays: [...activeOverlays, f.assoc("id", timestamp, content)],
      currentViewParams: f.assoc("overlayOpen", true, currentViewParams)
    });
  }

  closeOverlay = () => {
    return new Promise(
      (resolve, reject) => {
        const {currentViewParams, activeOverlays} = this.state;
        const overlayToClose = f.compose(
          f.last,
          f.reject(ol => f.contains(ol.id, this.exitingOverlays))
        )(activeOverlays);
        const fullSizeOverlays = activeOverlays.filter(f.matchesProperty("type", "full-height"));
        if (fullSizeOverlays.length > 1 && overlayToClose.type === "full-height") { // closing a right-aligned full-height overlay
          const removeOverlayAfterTimeout = () => {
            const {activeOverlays} = this.state;
            this.exitingOverlays = f.reject(f.eq(overlayToClose.id), this.exitingOverlays);
            this.setState({
              exitingOverlays: !f.isEmpty(this.exitingOverlays),
              activeOverlays: f.reject(f.matchesProperty("id", overlayToClose.id), activeOverlays),
              currentViewParams: f.assoc("overlayOpen", activeOverlays.length > 1, currentViewParams)
            });
          };
          this.exitingOverlays = [...this.exitingOverlays, overlayToClose.id];
          this.setState({exitingOverlays: true}, resolve);
          window.setTimeout(removeOverlayAfterTimeout, 400);
        } else {
          this.setState({
            activeOverlays: f.dropRight(1, activeOverlays),
            currentViewParams: f.assoc("overlayOpen", activeOverlays.length > 1, currentViewParams)
          }, resolve);
        }
      });
  };

  renderActiveOverlays() {
    let overlays = this.state.activeOverlays;
    if (f.isEmpty(overlays)) {
      return null;
    }

    const bigOverlayIdces = overlays
      .map((ol, idx) => (ol.type === "full-height") ? idx : null)
      .filter(f.isInteger); // 0 is falsy
    const nonExitingOverlays = f.reject(ii => f.contains(overlays[ii].id, this.exitingOverlays), bigOverlayIdces);

    const getSpecialClass = idx => {
      const left = f.dropRight(1)(f.intersection(bigOverlayIdces, nonExitingOverlays));
      const isExitingOverlay = idx => f.contains(overlays[idx].id, this.exitingOverlays);
      const followsAfterExitingOverlay = idx => {
        return (nonExitingOverlays.length < 2)
          ? false
          : overlays[f.last(nonExitingOverlays)].id === overlays[idx].id;
      };
      const shouldBeRightAligned = idx => {
        return followsAfterExitingOverlay(idx)
          || (f.isEmpty(this.exitingOverlays) && f.last(bigOverlayIdces) === idx);
      };
      const shouldBeLeftAligned = idx => f.contains(idx, left);

      return f.cond([
        [isExitingOverlay, f.always("is-right is-exiting")],
        [() => bigOverlayIdces.length < 2, f.noop],
        [shouldBeRightAligned, f.always("is-right")],
        [shouldBeLeftAligned, f.always("is-left")],
        [f.stubTrue, f.noop]
      ])(idx);
    };

    const topIndex = f.compose(
      f.last,
      f.reject(idx => f.contains(overlays[idx].id, this.exitingOverlays)),
      f.range(0)
    )(overlays.length);

    return overlays.map((overlayParams, idx) => {
      return (
        <GenericOverlay {...overlayParams}
                        key={`overlay-${idx}`}
                        isOnTop={idx === topIndex}
                        specialClass={getSpecialClass(idx)}
        />
      );
    });
  }

  renderToast() {
    const {toast} = this.state;
    if (toast) {
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
    const {activeOverlays, currentView, currentViewParams, isLoading} = this.state;
    if (isLoading) {
      return <div className="initial-loader"><Spinner isLoading={true} /></div>;
    } else {
      return <I18nextProvider i18n={i18n}>
        <div id="tableaux-view">
          <ViewRenderer viewName={currentView} params={currentViewParams} />
          {this.renderActiveOverlays()}
          <RootButton closeOverlay={this.closeOverlay}
                      activeOverlays={activeOverlays}
          />
          {this.renderToast()}
        </div>
      </I18nextProvider>;
    }
  }
}
