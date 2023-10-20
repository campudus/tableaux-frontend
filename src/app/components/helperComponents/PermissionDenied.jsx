import React from "react";
import i18n from "i18next";

const PermissionDenied = () => (
  <span className="permission-denied-item">
    ({i18n.t("common:permission_denied")})
  </span>
);

export default PermissionDenied;
