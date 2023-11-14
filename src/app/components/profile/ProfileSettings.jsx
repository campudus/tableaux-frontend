import React from "react";
import { t } from "i18next";
import { buildClassName as cn } from "../../helpers/buildClassName";
import Breadcrumbs from "../helperComponents/Breadcrumbs";
import { PROFILE_TAB } from "./constants";
import Toggle from "../helperComponents/Toggle";

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

      <div className="profile-tab__header">
        <h1 className="profile-tab__title">
          {t("profile:global-settings.title")}
        </h1>
        <h2 className="profile-tab__subtitle">
          {t("profile:global-settings.subtitle")}
        </h2>
      </div>

      <div className="profile-tab__content">
        <h3 className="profile-tab__title">
          {t("profile:global-settings.table-settings")}
        </h3>

        <h4 className="profile-tab__subtitle">
          {t("profile:global-settings.filter")}
        </h4>

        <div className="profile-tab__section">
          <div className="profile-tab__label">
            {t("profile:global-settings.filter-reset-label")}
          </div>
          <div className="profile-tab__description">
            {t("profile:global-settings.filter-reset-description")}
          </div>
          <Toggle className="profile-tab__toggle" />
        </div>

        <h4 className="profile-tab__subtitle">
          {t("profile:global-settings.columns")}
        </h4>

        <div className="profile-tab__section">
          <div className="profile-tab__label">
            {t("profile:global-settings.columns-reset-label")}
          </div>
          <div className="profile-tab__description">
            {t("profile:global-settings.columns-reset-description")}
          </div>
          <Toggle className="profile-tab__toggle" />
        </div>

        <h4 className="profile-tab__subtitle">
          {t("profile:global-settings.sorting")}
        </h4>

        <div className="profile-tab__section">
          <div className="profile-tab__label">
            {t("profile:global-settings.sorting-reset-label")}
          </div>
          <div className="profile-tab__description">
            {t("profile:global-settings.sorting-reset-description")}
          </div>
          <Toggle className="profile-tab__toggle" />
        </div>

        <hr className="profile-tab__divider" />

        <div className="profile-tab__section">
          <div className="profile-tab__label">
            {t("profile:global-settings.sorting-latest-top-label")}
          </div>
          <div className="profile-tab__description">
            {t("profile:global-settings.sorting-latest-top-description")}
          </div>
          <Toggle className="profile-tab__toggle" />
        </div>
      </div>

      <div className="profile-tab__actions">
        <button className={cn("profile-tab__button", { cancel: true })}>
          {t("common:cancel")}
        </button>

        <button className={cn("profile-tab__button", { submit: true })}>
          {t("common:save")}
        </button>
      </div>
    </div>
  );
}
