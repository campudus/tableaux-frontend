import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import ViewRenderer from "./ViewRenderer.jsx";
import i18n from "i18next";
import { I18nextProvider } from "react-i18next";
import f from "lodash/fp";
import RootButton from "./RootButton";
import resources from "i18next-resource-store-loader!../../locales/index";
import Overlays from "./overlay/Overlays";

export default class Tableaux extends PureComponent {
  static propTypes = {
    initialViewName: PropTypes.string.isRequired,
    initialParams: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.currentLangtag = props.initialParams.langtag;

    // Dispatcher.on(ActionTypes.SWITCH_VIEW, this.switchViewHandler, this);

    i18n.init({
      resources,
      // we need to define just 'en' otherwise fallback doesn't work correctly since i18next tries to load the
      // json only once with the exact fallbackLng Key. So 'en-GB' doesn't work because all
      fallbackLng: "en",
      lng: this.props.initialParams.langtag,

      // have a common namespace used around the full app
      ns: ["common", "header", "table", "media", "filter", "dashboard"],
      defaultNS: "common",

      debug: false,

      interpolation: {
        escapeValue: false // not needed for react!!
      }
    });

    this.state = {
      currentView: this.props.initialViewName,
      currentViewParams: this.props.initialParams,
      activeOverlays: [],
      exitingOverlays: false,
      toast: null
    };

    this.toastTimer = null;
    this.exitingOverlays = [];
  }

  componentWillUnmount() {
    // Dispatcher.off(ActionTypes.SWITCH_VIEW, this.switchViewHandler);
  }

  switchViewHandler(payload) {
    console.log("switchViewHandler", payload);
    // check if language has changed
    if (this.currentLangtag !== payload.params.langtag) {
      // ActionCreator.spinnerOn();
      i18n.changeLanguage(payload.params.langtag, () => {
        // ActionCreator.spinnerOff();
        this.currentLangtag = payload.params.langtag;
        this.changeView(payload);
      });
    } else {
      this.changeView(f.update("params", f.omit("urlOptions"), payload));
    }
  }

  changeView(payload) {
    this.setState({
      currentView: payload.viewName,
      currentViewParams: payload.params
    });
  }

  render() {
    const { activeOverlays, currentView, currentViewParams } = this.state;
    const { initialParams, actions } = this.props;
    return (
      <I18nextProvider i18n={i18n}>
        <div id="tableaux-view">
          <ViewRenderer
            viewName={currentView}
            params={initialParams}
            actions={actions}
          />
          <Overlays />
        </div>
      </I18nextProvider>
    );
  }
}
