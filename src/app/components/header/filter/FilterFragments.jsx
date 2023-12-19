import React from "react";
import i18n from "i18next";
import classNames from "classnames";

export const BoolInput = props => {
  const { value, onChangeValue } = props;
  const isYesSelected = value;
  const checkboxCss = classNames("checkbox", { checked: isYesSelected });
  return (
    <span className="bool-input col-four" onClick={onChangeValue}>
      <div className={checkboxCss} />
      <div className="selection-text">
        ({i18n.t(isYesSelected ? "common:yes" : "common:no")})
      </div>
    </span>
  );
};
