import { connect } from "react-redux";
import { withRouter, Redirect } from "react-router-dom";
import IFrame from "react-iframe";
import React from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { expandServiceUrl } from "../../frontendServiceRegistry/frontendServiceHelper";
import { retrieveTranslation } from "../../helpers/multiLanguage";
import { switchLanguageHandler } from "../Router";
import GrudHeader from "../GrudHeader";
import Spinner from "../header/Spinner";

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
  const [service, setService] = React.useState();

  // when service was unknown and services change (= init or service loading finished)
  React.useEffect(() => {
    if (service) return; // don't updated if service existed before
    const serviceToSet = f.find(f.propEq("id", serviceId), frontendServices);
    setService(serviceToSet);
  }, [frontendServices]);

  const serviceLoaded = !f.isEmpty(service);
  const pageTitle = f.isEmpty(service)
    ? "Frontend Service"
    : retrieveTranslation(langtag, service.displayName);
  const serviceUrl = serviceLoaded
    ? expandServiceUrl(
        { tableId, columnId, rowId, langtag },
        service.config.url
      )
    : "";

  const routeToService =
    `/${langtag}/services/${serviceId}` +
    (tableId ? `/tables/${tableId}` : "") +
    (columnId ? `/columns/${columnId}` : "") +
    (rowId ? `/rows/${rowId}` : "");

  return (
    <>
      <GrudHeader
        handleLanguageSwitch={handleLanguageSwitch}
        langtag={langtag}
        pageTitleOrKey={pageTitle}
      />
      <div className="frontend-service-main-view wrapper">
        {serviceLoaded ? (
          service.active && (
            <IFrame src={serviceUrl} width="100%" height="100%" />
          )
        ) : (
          <Spinner loading={true} />
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
