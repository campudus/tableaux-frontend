import React from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import SvgIcon from "../components/helperComponents/SvgIcon";

const ImageTypes = {
  SVG: "svg",
  RASTER: "raster",
  FONT: "font"
};

const ImageIcon = ({ url, base64 }) => {
  const src = base64 || url;
  const type =
    src && src === url && src.endsWith(".svg")
      ? ImageTypes.SVG
      : ImageTypes.RASTER;


  return type === ImageTypes.svg ? <SvgIcon icon={src} /> : <img src={src} />;
};

const FontIcon = ({ fontIconKey }) => <i className={"fa " + fontIconKey} />;

const ServiceIcon = ({ service }) => {
  const iconConfig = f.prop(["config", "icon"], service);
  const serviceHasIcon =
    iconConfig &&
    f.compose(
      f.any(f.identity),
      f.props(["url", "base64", "fontAwesome"])
    )(iconConfig);

  const iconType = iconConfig
    ? !f.isEmpty(iconConfig.fontAwesome)
      ? ImageTypes.FONT
      : "image"
    : ImageTypes.IMAGE;

  return (
    <div className="service-icon">
      {serviceHasIcon ? (
        iconType === ImageTypes.FONT ? (
          <FontIcon fontIconKey={iconConfig.fontAwesome} />
        ) : (
          <ImageIcon {...iconConfig} />
        )
      ) : (
        <FontIcon fontIconKey="fa-external-link" />
      )}
    </div>
  );
};

export default ServiceIcon;

ServiceIcon.propTypes = {
  service: PropTypes.object.isRequired
};
