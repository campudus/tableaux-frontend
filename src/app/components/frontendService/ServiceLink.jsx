import i18n from "i18next";
import f from "lodash/fp";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link, withRouter } from "react-router-dom";
import { expandServiceUrl } from "../../frontendServiceRegistry/frontendServiceHelper";
import route from "../../helpers/apiRoutes";
import actionCreators from "../../redux/actionCreators";

const { showToast } = actionCreators;

const ServiceLink = ({
  service,
  langtag,
  params = {},
  children,
  classNames,
  showToast
}) => {
  const target = service.config?.target || "iframe";
  const serviceUrl = expandServiceUrl(
    { ...params, langtag },
    service.config.url
  );

  const handleVoidClick = e => {
    e.preventDefault();
    const serviceName =
      service.displayName?.[langtag] || service.name || "Service";

    fetch(serviceUrl, { mode: "no-cors" })
      .then(() => {
        showToast({
          content: (
            <div id="cell-jump-toast">
              {i18n.t("frontend-service:message.void-success", {
                serviceName
              })}
            </div>
          ),
          duration: 2000
        });
      })
      .catch(error => {
        console.error(
          `Error executing service action at ${serviceUrl}:`,
          error
        );
        showToast({
          content: (
            <div id="cell-jump-toast">
              {i18n.t("frontend-service:message.void-error", {
                serviceName
              })}
            </div>
          ),
          duration: 5000
        });
      });
  };

  switch (target) {
    case "blank":
      return (
        <a
          className={classNames}
          href={serviceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    case "self":
      return (
        <a className={classNames} href={serviceUrl} target="_self">
          {children}
        </a>
      );
    case "void":
      return (
        <a className={classNames} href="#" onClick={handleVoidClick}>
          {children}
        </a>
      );
    case "iframe":
    default:
      return (
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
  }
};

ServiceLink.displayName = "ServiceLink";

ServiceLink.propTypes = {
  classNames: PropTypes.string,
  langtag: PropTypes.string.isRequired,
  params: PropTypes.object,
  service: PropTypes.object.isRequired,
  showToast: PropTypes.func
};

export default f.pipe(connect(null, { showToast }), withRouter)(ServiceLink);
