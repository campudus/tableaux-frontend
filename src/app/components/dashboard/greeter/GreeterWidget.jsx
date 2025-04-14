import { branch, compose, pure, renderNothing, withProps } from "recompose";
import React from "react";
import i18n from "i18next";

import PropTypes from "prop-types";

import { SHOW_DASHBOARD_USER_NAME } from "../../../FeatureFlags";
import { getUserName } from "../../../helpers/userNameHelper";
import getMotd from "./Messages";

const GreeterWidget = ({ userName, motd }) => {
  return (
    <div className="greeter tile wide">
      <div className="heading">
        <span className="default-text">
          {i18n.t("dashboard:greeter.hello")}
        </span>
        <UserName userName={userName} />,
      </div>
      <div className="default-text">{motd}</div>
      <div className="info-text">{i18n.t("dashboard:greeter.info")}</div>
    </div>
  );
};

// User name component dependent on feature flag
const UserName = branch(
  () => !SHOW_DASHBOARD_USER_NAME,
  renderNothing
)(({ userName }) => <span className="user-name">{userName}</span>);

const enhance = compose(
  pure,
  withProps(props => ({
    userName: getUserName(true /* onlyFirstName */),
    motd: getMotd(props.langtag)
  }))
);

GreeterWidget.propTypes = {
  langtag: PropTypes.string.isRequired
};

export default enhance(GreeterWidget);
