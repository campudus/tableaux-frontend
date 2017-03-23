import React, {Component, PropTypes} from "react";
import {sessionUnlock, isLocked} from "../../helpers/annotationHelper";
import ActionCreator from "../../actions/ActionCreator";
import * as f from "lodash/fp";
import i18n from "i18next";

const TOAST_TIME = 3000;

/* This is a stateful element */
class Candidates {
  static _cnd = [];
  static add(id) {
    this._cnd = [...this._cnd, id];
    window.setTimeout(() => this.remove(id), TOAST_TIME);
  }

  static remove(id) {
    this._cnd = f.remove(f.eq(id), this._cnd);
  }

  static has(id) {
    return (f.contains(id, this._cnd));
  }
}

const askForSessionUnlock = (el) => {
  if (!isLocked(el)) {
    return;
  }
  const {id} = el;

  if (Candidates.has(id)) {
    Candidates.remove(id);
    sessionUnlock(el);
  } else {
    Candidates.add(id);
    ActionCreator.showToast(<div id="cell-jump-toast">{i18n.t("table:final.unlock_toast")}</div>, TOAST_TIME);
  }
};

export default askForSessionUnlock;
