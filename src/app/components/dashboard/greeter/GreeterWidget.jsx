import i18n from "i18next";
import PropTypes from "prop-types";

import { SHOW_DASHBOARD_USER_NAME } from "../../../FeatureFlags";
import { getUserName } from "../../../helpers/userNameHelper";
import getMotd from "./Messages";

const GreeterWidget = ({ langtag }) => {
  const userName = getUserName(true /* onlyFirstName */);
  const motd = getMotd(langtag);

  return (
    <div className="greeter tile wide">
      <div className="heading">
        <span className="default-text">
          {i18n.t("dashboard:greeter.hello")}
        </span>
        <UserName username={userName} />,
      </div>
      <div className="default-text">{motd}</div>
      <div className="info-text">{i18n.t("dashboard:greeter.info")}</div>
    </div>
  );
};

// User name component dependent on feature flag
const UserName = ({ userName }) => {
  if (!SHOW_DASHBOARD_USER_NAME) {
    return null;
  }

  return <span className="user-name">{userName}</span>;
};

GreeterWidget.propTypes = {
  langtag: PropTypes.string.isRequired
};

export default GreeterWidget;
