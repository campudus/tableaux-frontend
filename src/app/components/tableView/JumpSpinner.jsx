import React from "react";
import i18n from "i18next";
import { Portal } from "react-portal";
import { branch, compose, renderNothing, pure } from "recompose";

const JumpSpinner = () => (
  <Portal isOpened={true}>
    <div id="jump-spinner-wrapper">
      <div className="jump-spinner">
        <div className="jump-spinner-content">
          <img
            className="jump-spinner-img"
            src="/img/holdOn.gif"
            alt="<Awesome spinner graphics>"
          />
          <div className="jump-spinner-title">
            {i18n.t("table:jumpspinner.title")}
          </div>
          <div className="jump-spinner-subtitle">
            {i18n.t("table:jumpspinner.subtitle")}
          </div>
        </div>
      </div>
    </div>
  </Portal>
);

export default compose(
  pure,
  branch(props => !props.isOpen, renderNothing)
)(JumpSpinner);
