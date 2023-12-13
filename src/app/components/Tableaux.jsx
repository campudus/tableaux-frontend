import { I18nextProvider } from "react-i18next";
import React from "react";
import f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";

import Overlays from "./overlay/Overlays";
import ViewRenderer from "./ViewRenderer";
import resources from "../../locales/index";

export default class Tableaux extends React.Component {
  static propTypes = {
    initialViewName: PropTypes.string.isRequired,
    initialParams: PropTypes.object.isRequired
  };

  shouldComponentUpdate(nextProps) {
    const { initialViewName, initialParams } = this.props;

    const updateRequired =
      initialViewName !== nextProps.initialViewName ||
      !f.equals(initialParams, nextProps.initialParams);

    return updateRequired;
  }

  constructor(props) {
    super(props);

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
  }

  render() {
    const { initialParams, actions, initialViewName } = this.props;

    return (
      <I18nextProvider i18n={i18n}>
        <div id="tableaux-view">
          <ViewRenderer
            viewName={initialViewName}
            params={initialParams}
            actions={actions}
          />
          <Overlays />
        </div>
      </I18nextProvider>
    );
  }
}
