import React from "react";
import i18n from "i18next";

const FlagDiff = props => {
  const {
    revision: { value, event }
  } = props;

  return (
    <div className="diff-flag-item">
      <div className="diff-event">{i18n.t(`history:${event}`)}</div>
      <div className="diff-flag-item__flag-type">
        {i18n.t(`history:${value}`)}
      </div>
    </div>
  );
};

export default FlagDiff;
