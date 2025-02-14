import React from "react";
import { t } from "i18next";
import f from "lodash/fp";
import { showDialog } from "../overlay/GenericOverlay";
import { PROFILE_TAB } from "../profile/constants";
import store from "../../redux/store";
import actions from "../../redux/actionCreators";
import { mapIndexed } from "../../helpers/functools";
import { saveColumnWidths } from "../../helpers/localStorage";

export default function ResetTableViewButton({
  tableId,
  langtag,
  columns,
  navigate
}) {
  const resetTableView = () => {
    const columnIds = f.map("id", columns);
    const columnOrdering = mapIndexed(({ id }, idx) => ({ id, idx }))(columns);

    store.dispatch(actions.setFiltersAndSorting([], [], true));
    store.dispatch(actions.setColumnsVisible(columnIds));
    store.dispatch(actions.setColumnOrdering(columnOrdering));
    store.dispatch(actions.setAnnotationHighlight(""));
    saveColumnWidths(tableId, {});
    store.dispatch(actions.rerenderTable());
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
