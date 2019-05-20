import { translate } from "react-i18next";
import React from "react";

import PropTypes from "prop-types";

import { ENABLE_DASHBOARD } from "../../FeatureFlags";
import Link from "../helperComponents/Link";
import MainMenuEntry from "../frontendService/MainMenuEntry";
import SvgIcon from "../helperComponents/SvgIcon";

const NavigationPopup = props => {
  const { langtag, t, services = [] } = props;

  return (
    <div id="main-navigation">
      <div id="logo">
        <SvgIcon icon={"/img/GRUD-Logo.svg"} />
      </div>
      <ul id="main-navigation-list">
        {ENABLE_DASHBOARD ? (
          <li>
            <Link href={"/" + langtag + "/dashboard"}>
              <i className="fa fa-dashboard" />
              {t("header:menu.dashboard")}
            </Link>
          </li>
        ) : null}

        <li>
          <Link href={"/" + langtag + "/table"}>
            <i className="fa fa-columns" />
            {t("header:menu.tables")}
          </Link>
        </li>

        <li>
          <Link href={"/" + langtag + "/media"}>
            <i className="fa fa-file" />
            {t("header:menu.media")}
          </Link>
        </li>

        {services.map(service => (
          <MainMenuEntry
            key={service.name}
            langtag={langtag}
            service={service}
          />
        ))}
      </ul>
    </div>
  );
};

NavigationPopup.propTypes = {
  langtag: PropTypes.string.isRequired,
  services: PropTypes.arrayOf(PropTypes.object).isRequired,
  navigationOpen: PropTypes.bool
};

export default translate(["header"])(NavigationPopup);
