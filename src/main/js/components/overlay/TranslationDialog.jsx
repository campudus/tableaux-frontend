import React, {Component, PropTypes} from "react";
import i18n from "i18next";
import {compose} from "lodash/fp";
import {showDialog} from "./GenericOverlay";

const openTranslationDialog = (context, confirm, cancel = function () {}) => {
  if (!confirm) {
    console.error("openTranslationDialog(confirm, cancel) needs at least a confirm function argument passed");
  }
  const buttons = {
    positive: [i18n.t("table:translations.flag_all"), confirm],
    neutral: [i18n.t("table:translations.dont_flag_all"), cancel]
  };
  showDialog({
    context: context,
    title: i18n.t("table:translations.dialog_headline"),
    message: i18n.t("table:translations.dialog_question"),
    type: "question",
    actions: buttons
  });
};

export default openTranslationDialog;
