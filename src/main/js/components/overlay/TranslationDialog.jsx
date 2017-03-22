import React, {Component, PropTypes} from "react";
import i18n from "i18next";
import {compose} from "lodash/fp";
import ActionCreator from "../../actions/ActionCreator";

class DialogHead extends Component {
  render() {
    return (
      <span>
        {i18n.t("table:translations.dialog_headline")}
      </span>
    )
  }
}

class DialogBody extends Component {
  render() {
    return (
      <div className="content-wrapper">
        {i18n.t("table:translations.dialog_question")}
      </div>
    )
  }
}

class DialogFooter extends Component {
  static propTypes = {
    confirm: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired
  };

  render() {
    const {confirm, cancel} = this.props;
    const close = ActionCreator.closeOverlay;

    return (
      <div className="button-wrapper">
        <a className="button positive" onClick={compose(close, confirm)}>
          {i18n.t("table:translations.flag_all")}
        </a>
        <a className="button neutral" onClick={compose(close, cancel)}>
          {i18n.t("table:translations.dont_flag_all")}
        </a>
      </div>
    )
  }
}

const openTranslationDialog = (confirm, cancel = function (){}) => {
  if (!confirm) {
    console.error("openTranslationDialog(confirm, cancel) needs at least a confirm function argument passed");
  }
  ActionCreator.openOverlay(
    {
      head: <DialogHead/>,
      body: <DialogBody/>,
      footer: <DialogFooter confirm={confirm} cancel={cancel} />,
      type: "flexible",
      keyboardShortcuts: {
        enter: event => {
          event.stopPropagation();
          confirm();
          ActionCreator.closeOverlay();
        },
        escape: event => {
          event.stopPropagation();
          cancel();
          ActionCreator.closeOverlay();
        }
      }
    })
};

export default openTranslationDialog;