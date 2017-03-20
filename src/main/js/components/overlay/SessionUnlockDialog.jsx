import React, {Component, PropTypes} from "react";
import {sessionUnlock, isLocked} from "../../helpers/annotationHelper";
import ActionCreator from "../../actions/ActionCreator";
import {compose, contains} from "lodash/fp";
import i18n from "i18next";

const askForSessionUnlock = (el) => {
  if (!isLocked(el)) {
    return;
  }

  class Body extends Component{
    render() {
      return <div className="content-wrapper">{i18n.t("unlock_dialog_body")}</div>;
    }
  }

  const doUnlock = () => sessionUnlock(el);
  const header = <span>{i18n.t("unlock_dialog_header")}</span>;
  const footer = (
    <div className="button-wrapper">
      <a href="#" className="button positive" onClick={compose(ActionCreator.closeOverlay, doUnlock)}>
        {i18n.t("common:yes")}
      </a>
      <a href="#" className="button neutral" onClick={ActionCreator.closeOverlay}>
        {i18n.t("common:no")}
      </a>
    </div>
  );
  ActionCreator.openOverlay({
    head: header,
    body: <Body />,
    footer,
    type: "flexible",
    keyboardShortcuts: {
      enter: compose(ActionCreator.closeOverlay, doUnlock),
      escape: ActionCreator.closeOverlay
    }
  })
};

export default askForSessionUnlock;