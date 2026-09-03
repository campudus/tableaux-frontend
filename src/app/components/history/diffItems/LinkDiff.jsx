import React, { useCallback, useState } from "react";
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

// Its own component because it owns hover state: the line count now varies per
// revision, and hooks called inside the map would tie React's hook order to it.
const LinkDiffItem = ({
  add,
  del,
  column,
  langtag,
  link,
  currentDisplayValues
}) => {
  const [hovered, setHovered] = useState(false);
  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  const { id, value } = link;
  // Each side of a diff is labelled with its own revision's attributes, or a
  // changed attribute would render as two identical lines.
  const withAttributes = base =>
    f.isString(base)
      ? formatLinkLabel({ column, link, displayValue: base, langtag })
      : base;

  const displayValue = withAttributes(currentDisplayValues[id]);
  const revisionValue = withAttributes(
    ifElse(f.isObject, retrieveTranslation(langtag), f.identity, value)
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
          // the bubble renders plain text, tags would show up literally
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
};

const LinkDiff = props => {
  const { diff, langtag } = props;
  const column = f.get(["cell", "column"], props);

  return diff.map(({ add, del, value: link, currentDisplayValues = {} }) => (
    <LinkDiffItem
      // An attribute change renders the same link twice, so its id alone
      // collides between the deleted and the added line.
      key={`${link.id}-${add ? "add" : del ? "del" : "same"}`}
      add={add}
      del={del}
      column={column}
      langtag={langtag}
      link={link}
      currentDisplayValues={currentDisplayValues}
    />
  ));
};

export default LinkDiff;
