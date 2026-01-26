import { connect } from "react-redux";
import { withRouter, Redirect } from "react-router-dom";
import IFrame from "react-iframe";
import React, { useEffect } from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { expandServiceUrl } from "../../frontendServiceRegistry/frontendServiceHelper";
import { switchLanguageHandler } from "../Router";
import GrudHeader from "../GrudHeader";
import FrontendServiceNotFound from "./FrontendServiceNotFound";

const FrontendServiceView = ({
  serviceId,
  langtag,
  frontendServices,
  tableId,
  columnId,
  rowId,
  history
}) => {
  const handleLanguageSwitch = React.useCallback(newLangtag =>
    switchLanguageHandler(history, newLangtag)
  );
  const service = f.find(f.propEq("id", serviceId), frontendServices);

  const urlParams = { tableId, columnId, rowId, langtag };
  const serviceUrl = !f.isEmpty(service)
    ? expandServiceUrl(urlParams, service.config.url)
    : "";

  const routeToService =
    `/${langtag}/services/${serviceId}` +
    (tableId ? `/tables/${tableId}` : "") +
    (columnId ? `/columns/${columnId}` : "") +
    (rowId ? `/rows/${rowId}` : "");

  const permissions = `clipboard-read; clipboard-write self ${serviceUrl}`;

  // Handle different target types
  useEffect(() => {
    if (!f.isEmpty(service) && service.active && serviceUrl) {
      const target = service.config.target || "iframe";

      switch (target) {
        case "blank":
          // Open in new tab
          window.open(serviceUrl, "_blank");
          history.goBack();
          break;
        case "self":
          // Open in same tab
          window.location.href = serviceUrl;
          history.goBack();
          break;
        case "void":
          // Fire and forget without opening anything
          fetch(serviceUrl).catch(error => {
            console.error(
              `Error executing service action at ${serviceUrl}:`,
              error
            );
          });
          history.goBack();
          break;
        case "iframe":
        default:
          // iframe handling is done in render
          break;
      }
    }
  }, [service, serviceUrl]);

  return (
    <>
      <GrudHeader
        handleLanguageSwitch={handleLanguageSwitch}
        langtag={langtag}
      />
      <div className="frontend-service-main-view wrapper">
        {!f.isEmpty(service) && service.active ? (
          service.config?.target === "iframe" ? (
            <IFrame
              src={serviceUrl}
              width="100%"
              height="100%"
              allow={permissions}
            />
          ) : null
        ) : (
          <FrontendServiceNotFound />
        )}
      </div>
      <Redirect to={routeToService} />
    </>
  );
};

FrontendServiceView.propTypes = {
  serviceId: PropTypes.number.isRequired,
  langtag: PropTypes.string.isRequired
};

export default f.pipe(
  connect(f.pick(["frontendServices"])),
  withRouter
)(FrontendServiceView);
