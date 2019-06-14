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
      <div className="main-navigation__logo">
        <SvgIcon icon={"/img/GRUD-Logo.svg"} />
      </div>
      <ul className="main-navigation__list">
        {ENABLE_DASHBOARD ? (
          <li className="main-navigation__entry">
            <Link
              href={"/" + langtag + "/dashboard"}
              className="main-navigation__entry-button"
            >
              <i className="fa fa-dashboard" />
              {t("header:menu.dashboard")}
            </Link>
          </li>
        ) : null}

        <li className="main-navigation__entry">
          <Link
            href={"/" + langtag + "/tables"}
            className="main-navigation__entry-button"
          >
            <i className="fa fa-columns" />
            {t("header:menu.tables")}
          </Link>
        </li>

        <li className="main-navigation__entry">
          <Link
            href={"/" + langtag + "/media"}
            className="main-navigation__entry-button"
          >
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
