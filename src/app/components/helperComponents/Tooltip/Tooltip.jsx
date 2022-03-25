import React from "react";
import i18n from "i18next";
import { retrieveTranslation } from "../../../helpers/multiLanguage";

const StatusIconTooltip = ({ translations, langtag, invert }) => {
  const text = retrieveTranslation(langtag, translations);
  return (
    <div className={`tooltip${invert ? "__invert" : ""}`}>
      <div className="tooltip__content">
        {text && <div className="tooltip__text">{i18n.t(text)}</div>}
      </div>
    </div>
  );
};

export default StatusIconTooltip;
