import i18n from "i18next";
import React from "react";
import { config } from "../constants/TableauxConstants";
import {
  getBannerColors,
  getCurrentEnvironment,
  isMarked
} from "../helpers/environment";

export default function EnvironmentBanner() {
  const environment = getCurrentEnvironment();

  if (!isMarked(environment)) {
    return null;
  }

  const { background, text } = getBannerColors(environment, {
    background: config.grudEnvironmentBackgroundColor,
    text: config.grudEnvironmentTextColor
  });

  return (
    <div
      className="environment-banner"
      style={{ backgroundColor: background, color: text }}
    >
      <i className="fa fa-flask" />
      <span className="environment-banner-name">
        {i18n.t(`common:environment_marker.${environment}`)}
      </span>
      <span>·</span>
      <span>{i18n.t("common:environment_marker.notice")}</span>
    </div>
  );
}
