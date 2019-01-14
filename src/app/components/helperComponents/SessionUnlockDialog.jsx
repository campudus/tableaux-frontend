import React from "react";
import { unlockRow, isLocked } from "../../helpers/annotationHelper";
// import ActionCreator from "../../actions/ActionCreator";
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
    return f.contains(id, this._cnd);
  }
}

const askForSessionUnlock = (el, key, actions) => {
  if (!isLocked(el)) {
    return;
  }
  const { id } = el;
  const keyCanUnlock = key && key === "Enter";

  if (Candidates.has(id) && (!key || keyCanUnlock)) {
    Candidates.remove(id);
    unlockRow(el);
  } else {
    if (!key || (key && keyCanUnlock)) {
      Candidates.add(id);
    }
    actions.showToast({
      content: (
        <div id="cell-jump-toast">
          <h1>{i18n.t("table:final.unlock_header")}</h1>
          <p>{i18n.t("table:final.unlock_toast")}</p>
        </div>
      ),
      duration: TOAST_TIME
    });
  }
};

export default askForSessionUnlock;
