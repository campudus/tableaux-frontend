import React from "react";

import PropTypes from "prop-types";
import classNames from "classnames";

import { formatNumber } from "../../../helpers/multiLanguage";
import { MAX_DIGITS } from "../../helperComponents/NumberInput";

const NumberDiff = props => {
  const { diff, shouldFormatNumber = true } = props;
  return diff.map(({ add, del, value }, idx) => {
    const cssClass = classNames("content-diff", {
      "content-diff--added": add,
      "content-diff--deleted": del
    });

    return (
      <span key={idx} className={cssClass}>
        {shouldFormatNumber
          ? formatNumber(value, MAX_DIGITS, props.langtag)
          : value}
      </span>
    );
  });
};

export default NumberDiff;
NumberDiff.propTypes = {
  diff: PropTypes.array.isRequired,
  shouldFormatNumber: PropTypes.boolean
};
