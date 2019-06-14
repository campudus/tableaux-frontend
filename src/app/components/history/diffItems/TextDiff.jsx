import PropTypes from "prop-types";
import React from "react";

import classNames from "classnames";

const TextDiff = props => {
  const { diff } = props;
  return diff.map(({ add, del, value }, idx) => {
    const cssClass = classNames("content-diff", {
      "content-diff--added": add,
      "content-diff--deleted": del
    });

    return (
      <span key={idx} className={cssClass}>
        {value}
      </span>
    );
  });
};

export default TextDiff;
TextDiff.propTypes = {
  diff: PropTypes.array.isRequired
};
