import React from "react";

import PropTypes from "prop-types";

import { retrieveTranslation } from "../../helpers/multiLanguage";
import Link from "../helperComponents/Link";
import route from "../../helpers/apiRoutes";

const MainMenuEntry = ({ service: { displayName, id }, langtag }) => (
  <li>
    <Link href={route.toFrontendServiceView(id)}>
      <i className="fa fa-external-link" />
      {retrieveTranslation(langtag, displayName)}
    </Link>
  </li>
);

export default MainMenuEntry;

MainMenuEntry.propTypes = {
  service: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired
};
