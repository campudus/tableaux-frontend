import { withHandlers } from "recompose";
import React, { useState } from "react";
import i18n from "i18next";

import PropTypes from "prop-types";
import classNames from "classnames";

import { calcRevisionDiff } from "./differ";
import { canUserChangeCell } from "../../helpers/accessManagementHelper";
import { cellSpec } from "../../specs/cell-spec";
import { confirmHistoryRevert } from "./HistoryOverlay";
import { formatTimeShort } from "../../helpers/multiLanguage";
import { validateProp } from "../../specs/type";
import Diff from "./diffItems/Diff";

const RevisionItem = props => {
  const { revision, langtag, cell } = props;
  const [hovered, setHoverState] = useState(false);

  const cssClass = classNames("revision__item", {
    "revision-item--hovered":
      hovered &&
      revision.revertable &&
      !revision.isCurrent &&
      canUserChangeCell(cell, langtag),
    "revision-item--non-consecutive": !revision.isConsecutive
  });

  const diff = calcRevisionDiff(cell, langtag, revision);

  const revertHere = () => {
    confirmHistoryRevert({ cell, langtag, revision });
  };

  return (
    <div
      className={cssClass}
      onMouseEnter={() => setHoverState(true)}
      onMouseLeave={() => setHoverState(false)}
    >
      {!revision.isCurrent && (
        <div className="revision-item__header">
          <div className="revision-item-header__dot" />
          <div className="revision-item-header__description">
            <div className="revision-item-header__time">
              {formatTimeShort(revision.timestamp)}
            </div>
            <div className="revision-item-header__title">
              {i18n.t(`history:${revision.event}`)}
            </div>
            <div className="revision-item-header__separator">&mdash;</div>
            <div className="revision-item-header__author">
              {revision.author}
            </div>
          </div>
          <button
            className="revision-item-header__revert-button"
            onClick={revertHere}
          >
            <div className="revert-button__text">
              {i18n.t("history:revert")}
            </div>
            <i className="revert-button__icon fa fa-history" />
          </button>
        </div>
      )}
      <div className="revision-item__content">
        <div className="revision-item__content-box">
          <Diff
            idx={props.idx}
            revision={revision}
            diff={diff}
            cell={cell}
            langtag={langtag}
          />
        </div>
      </div>
    </div>
  );
};

export default withHandlers({ revertHere: () => () => null })(RevisionItem);
RevisionItem.propTypes = {
  langtag: PropTypes.string.isRequired,
  revision: PropTypes.object.isRequired,
  cell: validateProp(cellSpec)
};
