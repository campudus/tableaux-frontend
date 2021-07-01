import React from "react";
import { translate } from "react-i18next";

const FrontendServiceNotFound = ({ t }) => (
  <div className="frontend-service-not-found">
    {t("frontend-service:message.not-found")}
  </div>
);

export default translate(["frontend-service"])(FrontendServiceNotFound);
