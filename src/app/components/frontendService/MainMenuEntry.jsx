import React from "react";

import PropTypes from "prop-types";

import { retrieveTranslation } from "../../helpers/multiLanguage";
import { Link } from "react-router-dom";
import ServiceIcon from "../../frontendServiceRegistry/ServiceIcon";
import route from "../../helpers/apiRoutes";

const MainMenuEntry = ({ service, service: { displayName, id }, langtag }) => (
  <li className="main-navigation__entry">
    <Link
      to={route.toFrontendServiceView(id, langtag)}
      className="main-navigation__entry-button"
    >
      <ServiceIcon service={service} />
      {retrieveTranslation(langtag, displayName)}
    </Link>
  </li>
);

export default MainMenuEntry;

MainMenuEntry.propTypes = {
  service: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired
};
