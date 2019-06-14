import React from "react";
import i18n from "i18next";

const RowCreatedDiff = () => (
  <div className="diff-event">{i18n.t("history:row_was_created")}</div>
);

export default RowCreatedDiff;
