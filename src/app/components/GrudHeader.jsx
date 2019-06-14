import { connect } from "react-redux";
import React from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { ConnectionStatus } from "./header/ConnectionStatus";
import { filterMainMenuEntries } from "../frontendServiceRegistry/frontendServices";
import LanguageSwitcher from "./header/LanguageSwitcher";
import Navigation from "./header/Navigation";
import PageTitle from "./header/PageTitle";

const mapStateToProps = state => {
  const services = state.frontendServices || [];
  const connectedToBackend = f.prop(["grudStatus", "connectedToBackend"])(
    state
  );

  return {
    services,
    connectedToBackend
  };
};

const GrudHeader = ({
  children,
  handleLanguageSwitch,
  langtag,
  pageTitleOrKey,
  connectedToBackend,
  services
}) => (
  <div className="grud-header-wrapper">
    <header className="grud-header">
      <Navigation
        langtag={langtag}
        services={services.filter(filterMainMenuEntries)}
      />
      {children || <div className="header-separator" />}
      <PageTitle titleKey={pageTitleOrKey} />
      <LanguageSwitcher langtag={langtag} onChange={handleLanguageSwitch} />
      <ConnectionStatus isConnected={connectedToBackend} />
    </header>
  </div>
);

export default connect(mapStateToProps)(GrudHeader);

GrudHeader.propTypes = {
  pageTitleOrKey: PropTypes.string.isRequired,
  langtag: PropTypes.string.isRequired,
  handleLanguageSwitch: PropTypes.func.isRequired
};
