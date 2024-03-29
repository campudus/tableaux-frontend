import f from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import { expandServiceUrl } from "../../frontendServiceRegistry/frontendServiceHelper";
import route from "../../helpers/apiRoutes";

const shouldOpenInNewTab = f.propEq("config.target", "_blank");

const ServiceLink = ({ service, langtag, params = {}, children, classNames }) =>
  shouldOpenInNewTab(service) ? (
    <a
      className={classNames}
      href={expandServiceUrl({ ...params, langtag }, service.config.url)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ) : (
    <Link
      className={classNames}
      to={route.toFrontendServiceView(service.id, langtag, {
        ...params,
        langtag
      })}
    >
      {children}
    </Link>
  );

ServiceLink.displayName = "ServiceLink";
export default ServiceLink;

ServiceLink.propTypes = {
  classNames: PropTypes.string,
  langtag: PropTypes.string.isRequired,
  params: PropTypes.object,
  service: PropTypes.object.isRequired
};
