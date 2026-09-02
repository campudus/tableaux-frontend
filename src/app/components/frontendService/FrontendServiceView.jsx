import f from "lodash/fp";
import React from "react";
import IFrame from "react-iframe";
import { connect } from "react-redux";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import PropTypes from "prop-types";

import { expandServiceUrl } from "../../frontendServiceRegistry/frontendServiceHelper";
import GrudHeader from "../GrudHeader";
import { switchLanguageHandler } from "../Router";
import FrontendServiceNotFound from "./FrontendServiceNotFound";

const FrontendServiceView = ({
  serviceId,
  langtag,
  frontendServices,
  tableId,
  columnId,
  rowId
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const handleLanguageSwitch = React.useCallback(newLangtag =>
    switchLanguageHandler(navigate, location.pathname, newLangtag)
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

  return (
    <>
      <GrudHeader
        handleLanguageSwitch={handleLanguageSwitch}
        langtag={langtag}
      />
      <div className="frontend-service-main-view wrapper">
        {!f.isEmpty(service) && service.active ? (
          <IFrame
            src={serviceUrl}
            width="100%"
            height="100%"
            allow={permissions}
          />
        ) : (
          <FrontendServiceNotFound />
        )}
      </div>
      <Navigate to={routeToService} replace />
    </>
  );
};

FrontendServiceView.propTypes = {
  serviceId: PropTypes.number.isRequired,
  langtag: PropTypes.string.isRequired
};

export default connect(f.pick(["frontendServices"]))(FrontendServiceView);
