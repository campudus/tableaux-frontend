import React from "react";
import i18n from "i18next";

import Header from "../overlay/Header";
import HistoryBody from "./HistoryBody";
import action from "../../redux/actionCreators";
import store from "../../redux/store";

export const openHistoryOverlay = ({ cell, langtag }) => {
  console.log({ cell, langtag });
  store.dispatch(
    action.openOverlay({
      head: <Header langtag={langtag} />,
      body: <HistoryBody cell={cell} langtag={langtag} />,
      cell,
      context: i18n.t("history:header-context"),
      type: "full-height"
    })
  );
};
