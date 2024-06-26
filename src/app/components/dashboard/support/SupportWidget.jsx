import { compose, pure, withProps, withStateHandlers } from "recompose";
import React from "react";
import f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";

import { config } from "../../../constants/TableauxConstants";
import { getUserName } from "../../../helpers/userNameHelper";

export const supportDetails = {
  title: "GRUD Team",
  phone: "+49 871 20667909",
  email: "support@grud.de"
};

const enhance = compose(
  pure,
  withProps({
    details: supportDetails
  }),
  withStateHandlers(() => ({ feedback: "" }), {
    handleChange: ({ feedback }) => event => ({
      feedback: f.getOr(feedback, ["target", "value"], event)
    }),
    handleSubmit: ({ feedback }) => () => {
      fetch(config.webhookUrl, {
        method: "POST",
        body: JSON.stringify({
          text: "Feedback",
          attachments: [
            {
              text: feedback,
              title: location.href, //   contains GRUD instance and user langtag
              author_name: getUserName() //   eslint-disable-line camelcase
            }
          ]
        })
      });

      return { feedback: "" };
    }
  })
);

const SupportWidget = ({
  handleSubmit,
  handleChange,
  feedback = "",
  details: { title, phone, email }
}) => {
  const { webhookUrl } = config;
  return (
    <div className="support">
      <div className="header">
        <div className="heading">{i18n.t("dashboard:support.heading")}</div>
        <div className="info-text">{i18n.t("dashboard:support.info")}</div>
      </div>

      <div className="tiles">
        <div className="contact-info">
          <div className="heading">
            {i18n.t("dashboard:support.contact-infos")}
          </div>
          <div className="contact-data">
            <div className="details title">{title}</div>
            <div>
              <a href={`tel:${phone.replace(/ /g, "")}`} className="details">
                <i className="fa fa-phone" />
                <span>{phone}</span>
              </a>
            </div>

            <div>
              <a href={`mailto:${email}`} className="details">
                <i className="fa fa-envelope-open" />
                <span>{email}</span>
              </a>
            </div>
          </div>
        </div>
        {webhookUrl && !f.isEmpty(webhookUrl) && (
          <>
            <div className="separator" />

            <div className="feedback">
              <div className="heading">Feedback</div>
              <textarea
                className="input"
                value={feedback}
                onChange={handleChange}
                placeholder={i18n.t("dashboard:support.feedback-placeholder")}
              />
              <div className="submit-button" onClick={handleSubmit}>
                {i18n.t("dashboard:support.submit-feedback")}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

SupportWidget.propTypes = {
  langtag: PropTypes.string.isRequired
};

export default enhance(SupportWidget);
