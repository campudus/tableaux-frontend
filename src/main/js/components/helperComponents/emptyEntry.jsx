import React from "react";
import i18n from "i18next";

const Empty = props => <span className="empty-item">({i18n.t("common:empty")}){props.children}</span>;

export default Empty;
