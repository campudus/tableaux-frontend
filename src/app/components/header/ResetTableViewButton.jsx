import { t } from "i18next";
import { showDialog } from "../overlay/GenericOverlay";
import { PROFILE_TAB } from "../profile/constants";
import store from "../../redux/store";
import actions from "../../redux/actionCreators";

export default function ResetTableViewButton({ tableId, langtag, navigate }) {
  const resetTableView = () => {
    store.dispatch(actions.deleteUserSettings({ kind: "table", tableId }));
    store.dispatch(actions.loadTableView(tableId));
  };

  const navigateToSettings = () => {
    navigate(`/${langtag}/profile/${PROFILE_TAB.SETTINGS}`);
    store.dispatch(actions.closeOverlay());
  };

  const openResetDialog = () =>
    showDialog({
      type: "warning",
      context: t("table:reset-table-view.context"),
      title: t("table:reset-table-view.title"),
      message: (
        <div className="reset-table-view-message">
          <p>{t("table:reset-table-view.message")}</p>
          <button
            className="reset-table-view-link"
            onClick={navigateToSettings}
          >
            {t("profile:navigation.global-settings")}
            <i className="fa fa-arrow-right" />
          </button>
        </div>
      ),
      buttonActions: {
        neutral: [t("common:cancel"), null],
        negative: [t("common:reset"), resetTableView]
      }
    });

  return (
    <button className="reset-table-view-button" onClick={openResetDialog}>
      {t("table:reset-table-view.button")}
    </button>
  );
}
