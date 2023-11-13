import React from "react";
import { t } from "i18next";
import { buildClassName as cn } from "../../helpers/buildClassName";
import Breadcrumbs from "../helperComponents/Breadcrumbs";
import { PROFILE_TAB } from "./constants";

export default function ProfileSettings({ langtag }) {
  return (
    <div className={cn("profile-tab", { settings: true })}>
      <Breadcrumbs
        links={[
          {
            path: `/${langtag}/dashboard`,
            label: t("header:menu.dashboard")
          },
          {
            path: `/${langtag}/profile/${PROFILE_TAB.SETTINGS}`,
            label: t("profile:navigation.global-settings")
          }
        ]}
      />
    </div>
  );
}
