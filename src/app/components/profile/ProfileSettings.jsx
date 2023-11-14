import React from "react";
import { t } from "i18next";
import { buildClassName as cn } from "../../helpers/buildClassName";
import Breadcrumbs from "../helperComponents/Breadcrumbs";
import { GLOBAL_SETTINGS, PROFILE_TAB } from "./constants";
import Toggle from "../helperComponents/Toggle";
import { useLocalStorage } from "../../helpers/useLocalStorage";

const {
  FILTER_RESET,
  COLUMNS_RESET,
  SORTING_RESET,
  SORTING_DESC
} = GLOBAL_SETTINGS;

export default function ProfileSettings({ langtag }) {
  const [filterReset, setFilterReset] = useLocalStorage(FILTER_RESET, false);
  const [columnsReset, setColumnsReset] = useLocalStorage(COLUMNS_RESET, false);
  const [sortingReset, setSortingReset] = useLocalStorage(SORTING_RESET, false);
  const [sortingDesc, setSortingDesc] = useLocalStorage(SORTING_DESC, false);

  const onChangeFilterReset = event => setFilterReset(event.target.checked);
  const onChangeColumnsReset = event => setColumnsReset(event.target.checked);
  const onChangeSortingReset = event => setSortingReset(event.target.checked);
  const onChangeSortingDesc = event => setSortingDesc(event.target.checked);

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
          <Toggle
            className="profile-tab__toggle"
            checked={filterReset}
            onChange={onChangeFilterReset}
          />
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
          <Toggle
            className="profile-tab__toggle"
            checked={columnsReset}
            onChange={onChangeColumnsReset}
          />
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
          <Toggle
            className="profile-tab__toggle"
            checked={sortingReset}
            onChange={onChangeSortingReset}
          />
        </div>

        <hr className="profile-tab__divider" />

        <div className="profile-tab__section">
          <div className="profile-tab__label">
            {t("profile:global-settings.sorting-desc-label")}
          </div>
          <div className="profile-tab__description">
            {t("profile:global-settings.sorting-desc-description")}
          </div>
          <Toggle
            className="profile-tab__toggle"
            checked={sortingDesc}
            onChange={onChangeSortingDesc}
          />
        </div>
      </div>
    </div>
  );
}
