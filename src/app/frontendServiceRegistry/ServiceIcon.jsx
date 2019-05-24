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
    src === url && src.endsWith(".svg") ? ImageTypes.svg : ImageTypes.raster;

  return type === ImageTypes.svg ? <SvgIcon src={src} /> : <img src={src} />;
};

const FontIcon = ({ fontIconKey }) => <i className={"fa " + fontIconKey} />;

const ServiceIcon = service => {
  const serviceHasIcon = !(
    service.icon &&
    f.any(f.identity, f.pick(["url", "base64", "fontAwesome"], service.icon))
  );

  const iconType = service.icon
    ? !f.isEmpty(service.icon.fontAwesome)
      ? ImageTypes.FONT
      : "image"
    : ImageTypes.IMAGE;

  return (
    <div className="service-icon">
      {serviceHasIcon ? (
        iconType === ImageTypes.FONT ? (
          <FontIcon fontIconKey={service.icon.fontAwesoe} />
        ) : (
          <ImageIcon {...service.icon} />
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
