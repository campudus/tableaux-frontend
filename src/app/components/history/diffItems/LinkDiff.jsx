import React from "react";
import f from "lodash/fp";

import classNames from "classnames";

import { ifElse, when } from "../../../helpers/functools";
import { formatLinkLabel } from "../../../helpers/linkAttributes";
import FormattedLabel, {
  stripFormattingTags
} from "../../helperComponents/FormattedLabel";
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
  const column = f.get(["cell", "column"], props);

  return diff.map(({ add, del, value: link, currentDisplayValues = {} }) => {
    const { id, value } = link;
    // A revision's attributes belong to that revision, so each side of a
    // diff is labelled with its own -- otherwise a changed attribute would
    // render as two identical lines. Falls through untouched for columns
    // without a formatPattern and for attachments.
    const withAttributes = base =>
      f.isString(base)
        ? formatLinkLabel({ column, link, displayValue: base, langtag })
        : base;

    const displayValue = withAttributes(currentDisplayValues[id]);
    const revisionValue = withAttributes(
      ifElse(f.isObject, retrieveTranslation(langtag), f.identity, value)
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
        : [
            "history:outdated-value",
            // the bubble renders plain text, so emphasis from the
            // formatPattern would otherwise show up as literal tags
            f.isString(revisionValue)
              ? stripFormattingTags(revisionValue)
              : revisionValue
          ];

    const tooltipBubble =
      state !== LinkState.DEFAULT && hovered ? (
        <TooltipBubble messages={tooltipMessage} />
      ) : null;

    return (
      <div
        className={cssClass}
        // An attribute change renders both sides of the same link, so the
        // id alone would collide between the deleted and the added line.
        key={`${id}-${add ? "add" : del ? "del" : "same"}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {stateIcon && (
          <div className="link-diff__icon">
            {tooltipBubble}
            {stateIcon}
          </div>
        )}
        <FormattedLabel
          text={
            state === LinkState.FOREIGN_ROW_DELETED
              ? when(f.isEmpty, () => displayValue, revisionValue)
              : displayValue
          }
        />
      </div>
    );
  });
};

export default LinkDiff;
