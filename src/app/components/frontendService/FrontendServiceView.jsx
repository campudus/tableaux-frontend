import { connect } from "react-redux";
import IFrame from "react-iframe";
import React from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { expandServiceUrl } from "../../frontendServiceRegistry/frontendServices";
import { retrieveTranslation } from "../../helpers/multiLanguage";
import GrudHeader from "../GrudHeader";
import Spinner from "../header/Spinner";

const FrontendServiceView = ({
  id,
  langtag,
  frontendServices,
  tableId,
  columnId,
  rowId
}) => {
  const noop = React.useCallback(() => null);
  const [service, setService] = React.useState();

  // when service was unknown and services change (= init or service loading finished)
  React.useEffect(() => {
    if (service) return; // don't updated if service existed before
    const serviceToSet = f.find(f.propEq("id", id), frontendServices);
    setService(serviceToSet);
  }, [frontendServices]);

  const serviceLoaded = !f.isEmpty(service);
  const pageTitle = f.isEmpty(service)
    ? "Frontend Service"
    : retrieveTranslation(langtag, service.displayName);
  const serviceUrl = serviceLoaded
    ? expandServiceUrl({ tableId, columnId, rowId }, service.config.url)
    : "";

  console.log({ serviceUrl });

  return (
    <>
      <GrudHeader
        handleLanguageSwitch={noop}
        langtag={langtag}
        pageTitle={pageTitle}
      />
      <div className="frontend-service-main-view wrapper">
        {serviceLoaded ? (
          <IFrame src={serviceUrl} width="100%" height="100%" />
        ) : (
          <Spinner loading={true} />
        )}
      </div>
    </>
  );
};

FrontendServiceView.propTypes = {
  id: PropTypes.number.isRequired,
  langtag: PropTypes.string.isRequired
};

export default connect(f.pick(["frontendServices"]))(FrontendServiceView);
