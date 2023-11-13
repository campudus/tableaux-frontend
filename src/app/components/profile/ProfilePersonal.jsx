import React from "react";
import { t } from "i18next";
import { buildClassName as cn } from "../../helpers/buildClassName";
import Breadcrumbs from "../helperComponents/Breadcrumbs";
import { getLogin } from "../../helpers/authenticate";
import UserIcon from "./UserIcon";

export default function ProfilePersonal({ langtag }) {
  const login = getLogin();
  const info = login.tokenParsed;

  return (
    <div className={cn("profile-tab", { personal: true })}>
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

      <div className="profile-tab__header">
        <h1 className="profile-tab__title">
          {t("profile:personal-data.title")}
        </h1>
        <h2 className="profile-tab__subtitle">
          {t("profile:personal-data.subtitle")}
        </h2>
      </div>

      <div className="profile-tab__section">
        <UserIcon className="profile-tab__icon" />
        {!!info && (
          <div className="profile-tab__info">
            <div className="profile-tab__label">
              {t("profile:personal-data.display-name")}
            </div>
            <div className="profile-tab__value">{info.preferred_username}</div>
            <div className="profile-tab__label">
              {t("profile:personal-data.user-name")}
            </div>
            <div className="profile-tab__value">{info.name}</div>
            <div className="profile-tab__label">
              {t("profile:personal-data.email-address")}
            </div>
            <div className="profile-tab__value">{info.email}</div>
          </div>
        )}
      </div>
    </div>
  );
}
