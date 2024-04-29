import f from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import { ConnectionStatus } from "./header/ConnectionStatus";
import LanguageSwitcher from "./header/LanguageSwitcher";
import Navigation from "./header/Navigation";
import PageTitle from "./header/PageTitle";
import UserMenu from "./header/UserMenu";

const GrudHeader = ({
  children,
  handleLanguageSwitch,
  langtag,
  pageTitleOrKey
}) => {
  const connectedToBackend = useSelector(
    f.prop(["grudStatus", "connectedToBackend"])
  );
  return (
    <div className="grud-header-wrapper">
      <header className="grud-header">
        <Navigation langtag={langtag} />
        {children || <div className="header-separator" />}
        <PageTitle titleKey={pageTitleOrKey} />
        <LanguageSwitcher langtag={langtag} onChange={handleLanguageSwitch} />
        <ConnectionStatus isConnected={connectedToBackend} />
        <UserMenu langtag={langtag} />
      </header>
    </div>
  );
};

export default GrudHeader;

GrudHeader.propTypes = {
  pageTitleOrKey: PropTypes.string.isRequired,
  langtag: PropTypes.string.isRequired,
  handleLanguageSwitch: PropTypes.func.isRequired
};
