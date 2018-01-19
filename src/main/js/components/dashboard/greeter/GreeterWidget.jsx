import React from "react";
import PropTypes from "prop-types";
import i18n from "i18next";
import {compose, pure, withProps} from "recompose";

const GreeterWidget = ({userName, motd}) => (
  <div className="greeter tile wide">
    <div className="heading">
      <span className="default-text">{i18n.t("dashboard:greeter.hello")}</span>
      <span className="user-name">{userName},</span>
    </div>
    <div className="default-text">{motd}</div>
    <div className="info-text">{i18n.t("dashboard:greeter.info")}</div>
  </div>
);

//TODO: Get MOTD

const enhance = compose(
  pure,
  withProps({
    userName: "John Deaux",
    motd: "This is the message of the day!"
  })
);

GreeterWidget.propTypes = {
  langtag: PropTypes.string.isRequired
};

export default enhance(GreeterWidget);
