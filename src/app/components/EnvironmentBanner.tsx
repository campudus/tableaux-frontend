import i18n from "i18next";
import React, { useLayoutEffect, useRef, useState } from "react";
import { config } from "../constants/TableauxConstants";
import {
  getBannerColor,
  getContrastTextColor,
  getCurrentEnvironment,
  isMarked,
  parseRgb
} from "../helpers/environment";

export default function EnvironmentBanner() {
  const environment = getCurrentEnvironment();
  const bannerRef = useRef<HTMLDivElement>(null);
  const [textColor, setTextColor] = useState<string>();

  const backgroundColor = isMarked(environment)
    ? getBannerColor(environment, config.grudEnvironmentColor)
    : undefined;

  // any CSS color is allowed, so let the browser resolve it to rgb
  useLayoutEffect(() => {
    if (!bannerRef.current) return;
    const rgb = parseRgb(getComputedStyle(bannerRef.current).backgroundColor);
    setTextColor(rgb ? getContrastTextColor(rgb) : undefined);
  }, [backgroundColor]);

  if (!isMarked(environment)) {
    return null;
  }

  return (
    <div
      ref={bannerRef}
      className="environment-banner"
      style={{ backgroundColor, color: textColor }}
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
