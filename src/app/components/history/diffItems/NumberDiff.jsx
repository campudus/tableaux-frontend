import React from "react";

import PropTypes from "prop-types";
import classNames from "classnames";

import { formatNumber } from "../../../helpers/multiLanguage";

const NumberDiff = props => {
  const { diff } = props;
  return diff.map(({ add, del, value }, idx) => {
    const cssClass = classNames("content-diff", {
      "content-diff--added": add,
      "content-diff--deleted": del
    });

    console.log("value:", typeof value, value, formatNumber(value));

    return (
      <span key={idx} className={cssClass}>
        {formatNumber(value)}
      </span>
    );
  });
};

export default NumberDiff;
NumberDiff.propTypes = {
  diff: PropTypes.array.isRequired
};
