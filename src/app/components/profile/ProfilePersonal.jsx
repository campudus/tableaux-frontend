import React from "react";
import { t } from "i18next";
import Breadcrumbs from "../helperComponents/Breadcrumbs";

export default function ProfilePersonal({ langtag }) {
  return (
    <div className="profile-personal">
      <Breadcrumbs
        links={[
          {
            path: `/${langtag}/dashboard`,
            label: t("header:menu.dashboard")
          },
          {
            path: `/${langtag}/profile`,
            label: t("profile:navigation.personal-data")
          }
        ]}
      />
    </div>
  );
}
