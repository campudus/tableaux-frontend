import React, { useCallback } from "react";
import { NavLink, withRouter } from "react-router-dom";
import { t } from "i18next";
import GrudHeader from "../GrudHeader";
import { switchLanguageHandler as switchLang } from "../Router";
import { buildClassName as cn } from "../../helpers/buildClassName";
import { PROFILE_TAB } from "./constants";
import ProfileSettings from "./ProfileSettings";
import ProfilePersonal from "./ProfilePersonal";

const TAB_COMPONENT = {
  [PROFILE_TAB.SETTINGS]: ProfileSettings
};

function ProfileView({ langtag, history, profileTab }) {
  const handleLanguageSwitch = useCallback(value => switchLang(history, value));
  const TabContent = TAB_COMPONENT[profileTab] ?? ProfilePersonal;

  return (
    <>
      <GrudHeader
        langtag={langtag}
        handleLanguageSwitch={handleLanguageSwitch}
      />
      <div id="profile-view" className={cn("profile-view", null, "wrapper")}>
        <div className="profile-view__inner">
          <div className="profile-view__navigation">
            <NavLink
              to={`/${langtag}/profile`}
              className="profile-view__link"
              exact
            >
              <i className="fa fa-user-circle" />
              {t("profile:navigation.personal-data")}
            </NavLink>

            <NavLink
              to={`/${langtag}/profile/${PROFILE_TAB.SETTINGS}`}
              className="profile-view__link"
              exact
            >
              <i className="fa fa-sliders" />
              {t("profile:navigation.global-settings")}
            </NavLink>
          </div>

          <div className="profile-view__content">
            <TabContent langtag={langtag} />
          </div>
        </div>
      </div>
    </>
  );
}

export default withRouter(ProfileView);
