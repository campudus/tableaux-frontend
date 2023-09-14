import React from "react";
import f from "lodash/fp";

import classNames from "classnames";

import { ifElse, when } from "../../../helpers/functools";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import SvgIcon from "../../helperComponents/SvgIcon";
import TooltipBubble from "../../helperComponents/TooltipBubble";

const LinkState = {
  FOREIGN_ROW_DELETED: 1,
  CHANGED: 2,
  DEFAULT: 3
};

const LinkDiff = props => {
  const { diff, langtag } = props;

  return diff.map(
    ({ add, del, value: { id, value }, currentDisplayValues = {} }) => {
      const displayValue = currentDisplayValues[id];
      const revisionValue = ifElse(
        f.isObject,
        retrieveTranslation(langtag),
        f.identity,
        value
      );

      const [hovered, setHovered] = React.useState(false);
      const handleMouseEnter = React.useCallback(() => {
        setHovered(true);
      });

      const handleMouseLeave = React.useCallback(() => {
        setHovered(false);
      });

      const state = f.isEmpty(displayValue)
        ? LinkState.FOREIGN_ROW_DELETED
        : displayValue !== revisionValue
        ? LinkState.CHANGED
        : LinkState.DEFAULT;

      const cssClass = classNames("link-diff", {
        "content-diff--added": add,
        "content-diff--deleted": del,
        "content-diff--foreign-row-deleted":
          state === LinkState.FOREIGN_ROW_DELETED,
        "content-diff--with-tooltip": hovered
      });

      const stateIcon =
        state === LinkState.FOREIGN_ROW_DELETED ? (
          <SvgIcon icon="deletedFile" />
        ) : state === LinkState.CHANGED && !f.isEmpty(revisionValue) ? (
          <i className="fa fa-info-circle" />
        ) : null;

      const tooltipMessage =
        state === LinkState.FOREIGN_ROW_DELETED
          ? ["history:remote-row-deleted"]
          : ["history:outdated-value", revisionValue];

      const tooltipBubble =
        state !== LinkState.DEFAULT && hovered ? (
          <TooltipBubble messages={tooltipMessage} />
        ) : null;

      return (
        <div
          className={cssClass}
          key={id}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {stateIcon && (
            <div className="link-diff__icon">
              {tooltipBubble}
              {stateIcon}
            </div>
          )}
          {state === LinkState.FOREIGN_ROW_DELETED
            ? when(f.isEmpty, () => displayValue, revisionValue)
            : displayValue}
        </div>
      );
    }
  );
};

export default LinkDiff;
