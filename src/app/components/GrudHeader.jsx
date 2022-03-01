import { connect } from "react-redux";
import React from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { ConnectionStatus } from "./header/ConnectionStatus";
import LanguageSwitcher from "./header/LanguageSwitcher";
import Navigation from "./header/Navigation";
import PageTitle from "./header/PageTitle";

const mapStateToProps = state => {
  const connectedToBackend = f.prop(["grudStatus", "connectedToBackend"])(
    state
  );

  return {
    connectedToBackend
  };
};

const GrudHeader = ({
  children,
  handleLanguageSwitch,
  langtag,
  pageTitleOrKey,
  connectedToBackend
}) => (
  <div className="grud-header-wrapper">
    <header className="grud-header">
      <Navigation langtag={langtag} />
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
