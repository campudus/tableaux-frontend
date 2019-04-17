import React from "react";
import i18n from "i18next";

import { SimpleHeader } from "../overlay/Header";
import HistoryBody from "./HistoryBody";
import action from "../../redux/actionCreators";
import store from "../../redux/store";

export const openHistoryOverlay = ({ cell, langtag }) => {
  console.log({ cell, langtag });
  store.dispatch(
    action.openOverlay({
      head: (
        <SimpleHeader
          langtag={langtag}
          title={i18n.t("history:history-view")}
        />
      ),
      body: <HistoryBody cell={cell} langtag={langtag} />,
      cell,
      context: i18n.t("history:header-context"),
      type: "full-height"
    })
  );
};
