import React from "react";
import f from "lodash/fp";

import classNames from "classnames";

import { ifElse, when } from "../../../helpers/functools";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import SvgIcon from "../../helperComponents/SvgIcon";

const LinkState = {
  FOREIGN_ROW_DELETED: 1,
  CHANGED: 2,
  DEFAULT: 3
};

const LinkDiff = props => {
  const { diff } = props;

  return diff.map(
    ({ add, del, value: { id, value }, currentDisplayValues = {} }) => {
      const displayValue = currentDisplayValues[id];
      const revisionValue = ifElse(
        f.isObject,
        retrieveTranslation,
        f.identity,
        value
      );

      const state = f.isEmpty(displayValue)
        ? LinkState.FOREIGN_ROW_DELETED
        : displayValue !== revisionValue
        ? LinkState.CHANGED
        : LinkState.DEFAULT;

      const cssClass = classNames("link-diff", {
        "content-diff--added": add,
        "content-diff--deleted": del,
        "content-diff--foreign-row-deleted":
          state === LinkState.FOREIGN_ROW_DELETED
      });

      const stateIcon =
        state === LinkState.FOREIGN_ROW_DELETED ? (
          <SvgIcon icon="deletedFile" containerClasses="link-diff__icon" />
        ) : state === LinkState.CHANGED && !f.isEmpty(revisionValue) ? (
          <i className="link-diff__icon fa fa-history" />
        ) : null;

      return (
        <div className={cssClass} key={id}>
          {stateIcon}
          {state === LinkState.FOREIGN_ROW_DELETED
            ? when(f.isEmpty, () => displayValue, revisionValue)
            : displayValue}
        </div>
      );
    }
  );
};

export default LinkDiff;
