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
    console.log("adding", id, "to", this._cnd);
    this._cnd = [...this._cnd, id];
    window.setTimeout(() => this.remove(id), TOAST_TIME)
    console.log("Now:", this._cnd);
  }

  static remove(id) {
    console.log("removing", id, "from", this._cnd);
    this._cnd = f.remove(f.eq(id), this._cnd);
    console.log("Now:", this._cnd);
  }

  static has(id) {
    console.log("looking up", id, "in", this._cnd, f.contains(id, this._cnd));
    return (f.contains(id, this._cnd))
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
    ActionCreator.showToast(<div id="cell-jump-toast">{i18n.t("table:final.unlock_toast")}</div>, TOAST_TIME );
  }
};

export default askForSessionUnlock;