import React from "react";
import i18n from "i18next";

import ConfirmRevertOverlay from "./ConfirmRevertOverlay";
import Footer from "../overlay/Footer";
import Header from "../overlay/Header";
import HistoryBody from "./HistoryBody";
import HistoryHeader from "./HistoryHeader";
import action from "../../redux/actionCreators";
import getDisplayValue from "../../helpers/getDisplayValue";
import store from "../../redux/store";

export const HISTORY_OVERLAY_NAME = "__HISTORY__OVERLAY__";

export const confirmHistoryRevert = props => {
  const { cell, langtag } = props;
  // create a preview revision from current value to the revision that should be reverted to

  const revision = {
    ...props.revision,
    prevContent: cell.value,
    prevDisplayValue: getDisplayValue(cell.column, cell.value)
  };

  const buttonActions = {
    positive: [
      i18n.t("history:revert"),
      () => {
        store.dispatch(
          action.changeCellValue({
            cell,
            newValue: revision.value,
            oldValue: cell.value
          })
        );
        store.dispatch(action.closeOverlay(HISTORY_OVERLAY_NAME));
      }
    ],
    neutral: [i18n.t("common:cancel"), () => null]
  };

  store.dispatch(
    action.openOverlay({
      head: (
        <Header
          context={i18n.t("history:revert")}
          title={i18n.t("history:please-check-changes")}
        />
      ),
      body: (
        <ConfirmRevertOverlay
          cell={cell}
          langtag={langtag}
          revision={revision}
        />
      ),
      footer: <Footer buttonActions={buttonActions} />,
      classes: "revision-history-overlay"
    })
  );
};

export const openHistoryOverlay = ({ cell, langtag }) => {
  store.dispatch(
    action.openOverlay({
      head: <HistoryHeader langtag={langtag} />,
      body: <HistoryBody cell={cell} langtag={langtag} />,
      cell,
      context: i18n.t("history:header-context"),
      type: "full-height",
      classes: "revision-history-overlay",
      preferRight: true,
      name: HISTORY_OVERLAY_NAME
    })
  );
};
