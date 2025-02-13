import React from "react";
import { t } from "i18next";
import { buildClassName as cn } from "../../helpers/buildClassName";
import Breadcrumbs from "../helperComponents/Breadcrumbs";
import { PROFILE_TAB } from "./constants";
import Toggle from "../helperComponents/Toggle";
import { useDispatch, useSelector } from "react-redux";
import { GLOBAL_SETTING } from "../../redux/reducers/globalSettings";
import action from "../../redux/actionCreators";

const {
  FILTER_RESET,
  COLUMNS_RESET,
  SORTING_RESET,
  SORTING_DESC,
  ANNOTATION_RESET
} = GLOBAL_SETTING;

const { setGlobalSettings } = action;

const globalSettingsSelector = state => {
  return state.globalSettings;
};

export default function ProfileSettings({ langtag }) {
  const settings = useSelector(globalSettingsSelector);
  const dispatch = useDispatch();

  const onChangeFilterReset = event => {
    dispatch(setGlobalSettings({ [FILTER_RESET]: event.target.checked }));
  };
  const onChangeColumnsReset = event => {
    dispatch(setGlobalSettings({ [COLUMNS_RESET]: event.target.checked }));
  };
  const onChangeSortingReset = event => {
    dispatch(setGlobalSettings({ [SORTING_RESET]: event.target.checked }));
  };
  const onChangeSortingDesc = event => {
    dispatch(setGlobalSettings({ [SORTING_DESC]: event.target.checked }));
  };
  const onChangeAnnotationReset = event => {
    dispatch(setGlobalSettings({ [ANNOTATION_RESET]: event.target.checked }));
  };

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
            checked={settings[FILTER_RESET]}
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
            checked={settings[COLUMNS_RESET]}
            onChange={onChangeColumnsReset}
          />
        </div>

        <hr className="profile-tab__divider" />

        <div className="profile-tab__section">
          <div className="profile-tab__label">
            {t("profile:global-settings.annotation-reset-label")}
          </div>
          <div className="profile-tab__description">
            {t("profile:global-settings.annotation-reset-description")}
          </div>
          <Toggle
            className="profile-tab__toggle"
            checked={settings[ANNOTATION_RESET]}
            onChange={onChangeAnnotationReset}
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
            checked={settings[SORTING_RESET]}
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
            checked={settings[SORTING_DESC]}
            onChange={onChangeSortingDesc}
          />
        </div>
      </div>
    </div>
  );
}
