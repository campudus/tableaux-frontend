import React from "react";
import PropTypes from "prop-types";
import i18n from "i18next";
import {compose, pure, withProps, withStateHandlers} from "recompose";
import f from "lodash/fp";
import Raven from "raven-js";

const enhance = compose(
  pure,
  withProps({
    details: {
      title: "Campudus GmbH",
      phone: "+49 871 20667909",
      email: "support@grud.de"
    }
  }),
  withStateHandlers(
    () => ({feedback: ""}),
    {
      handleChange: ({feedback}) => (event) => ({feedback: f.getOr(feedback, ["target", "value"], event)}),
      handleSubmit: ({feedback}) => () => {
        Raven.captureMessage(feedback, {
          level: "info",
          tags: {type: "support-feedback"}
        });
      }
    }
  )
);

const SupportWidget = (
  {
    handleSubmit,
    handleChange,
    feedback = "",
    details: {title, phone, email}
  }) => (
  <div className="support">

    <div className="header">
      <div className="heading">{i18n.t("dashboard.support:heading") || "Support"}</div>
      <div className="info-text">{i18n.t("dashboard.support:info") || "The nice guys at Campudus"}</div>
    </div>

    <div className="tiles">

      <div className="contact-info">
        <div className="heading">{i18n.t("dashboard.support:contact-infos") || "Technical Support"}</div>
        <div className="contact-data">
          <div className="details">{title}</div>
          <div className="details">{`${i18n.t("dashboard.support:phone")}: ${phone}`}</div>
          <div className="details">{email}</div>
        </div>
      </div>

      <div className="separator"/>

      <div className="feedback">
        <div className="heading">Feedback</div>
        <textarea className="input"
                  value={feedback}
                  onChange={handleChange}
                  placeholder={i18n.t("dashboard.support:feedback-placeholder")}
        />
        <div className="submit-button"
             onClick={handleSubmit}
        >
          {i18n.t("dashboard.support:submit-feedback") || "Submit feedback"}
        </div>
      </div>
    </div>
  </div>
);

SupportWidget.propTypes = {
  langtag: PropTypes.string.isRequired
};

export default enhance(SupportWidget);
