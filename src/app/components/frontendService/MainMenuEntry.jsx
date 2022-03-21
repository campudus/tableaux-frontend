import PropTypes from "prop-types";
import React from "react";
import ServiceIcon from "../../frontendServiceRegistry/ServiceIcon";
import { retrieveTranslation } from "../../helpers/multiLanguage";
import ServiceLink from "./ServiceLink";

const MainMenuEntry = ({ service, service: { displayName }, langtag }) => (
  <li className="main-navigation__entry">
    <ServiceLink classNames="main-navigation__entry-button" langtag={langtag} service={service}>
      <ServiceIcon service={service} />
      {retrieveTranslation(langtag, displayName)}
    </ServiceLink>
  </li>
);

export default MainMenuEntry;

MainMenuEntry.propTypes = {
  service: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired
};
