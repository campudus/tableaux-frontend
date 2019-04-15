import React from "react";
import f from "lodash/fp";

import classNames from "classnames";

import { ifElse } from "../../../helpers/functools";
import { retrieveTranslation } from "../../../helpers/multiLanguage";

const LinkDiff = props => {
  const { diff } = props;

  return diff.map(({ add, del, value: { id, value } }) => {
    const cssClass = classNames("link-diff", {
      "content-diff--added": add,
      "content-diff--deleted": del
    });

    return (
      <div className={cssClass} key={id}>
        {ifElse(f.isObject, retrieveTranslation, f.identity, value)}
      </div>
    );
  });
};

export default LinkDiff;
