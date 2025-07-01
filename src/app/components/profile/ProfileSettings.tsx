import { ChangeEvent } from "react";
import { t } from "i18next";
import { buildClassName as cn } from "../../helpers/buildClassName";
import Breadcrumbs from "../helperComponents/Breadcrumbs";
import { PROFILE_TAB } from "./constants";
import Toggle from "../helperComponents/Toggle";
import { useDispatch, useSelector } from "react-redux";
import action from "../../redux/actionCreators";
import { makeRequest } from "../../helpers/apiHelper";
import route from "../../helpers/apiRoutes";
import { UserSettingKeyGlobal } from "../../types/userSettings";
import { GRUDStore } from "../../types/grud";
import { UserSettingsState } from "../../redux/reducers/userSettings";

type ProfileSettingsProps = {
  langtag: string;
};

export default function ProfileSettings({ langtag }: ProfileSettingsProps) {
  const dispatch = useDispatch();
  const settings = useSelector<GRUDStore, UserSettingsState["global"]>(
    state => state.userSettings.global
  );

  const buildOnChange = (key: UserSettingKeyGlobal) => {
    return async (event: ChangeEvent<HTMLInputElement>) => {
      await makeRequest({
        method: "PUT",
        apiRoute: route.toUserSettings({ kind: "global", key }),
        data: { value: event.target.checked }
      })
        .then(setting => dispatch(action.setUserSettings([setting])))
        .catch(console.error);
    };
  };

  const onChangeFilterReset = buildOnChange("filterReset");
  const onChangeColumnsReset = buildOnChange("columnsReset");
  const onChangeSortingReset = buildOnChange("sortingReset");
  const onChangeSortingDesc = buildOnChange("sortingDesc");
  const onChangeAnnotationReset = buildOnChange("annotationReset");

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
            checked={settings.filterReset}
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
            checked={settings.columnsReset}
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
            checked={settings.annotationReset}
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
            checked={settings.sortingReset}
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
            checked={settings.sortingDesc}
            onChange={onChangeSortingDesc}
          />
        </div>
      </div>
    </div>
  );
}
