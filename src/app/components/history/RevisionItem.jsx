import { withHandlers } from "recompose";
import React, { useState } from "react";
import i18n from "i18next";

import PropTypes from "prop-types";
import classNames from "classnames";

import { calcRevisionDiff } from "./differ";
import { cellSpec } from "../../specs/cell-spec";
import { confirmHistoryRevert } from "./HistoryOverlay";
import { validateProp } from "../../specs/type";
import Diff from "./diffItems/Diff";

const RevisionItem = props => {
  const { revision, langtag, cell } = props;
  const [hovered, setHoverState] = useState(false);

  const cssClass = classNames("revision__item", {
    "revision-item--hovered": hovered && revision.revertable
  });

  const diff = calcRevisionDiff(cell, langtag, revision);

  console.log("revisionItem", props);

  const revertHere = () => {
    confirmHistoryRevert({ cell, langtag, revision });
  };

  return (
    <div
      className={cssClass}
      onMouseEnter={() => setHoverState(true)}
      onMouseLeave={() => setHoverState(false)}
    >
      <div className="revision-item__header">
        <div className="revision-item-header__dot" />
        <div className="revision-item-header__description">
          <div className="revision-item-header__time">
            {getTime(revision.timestamp)}
          </div>
          <div className="revision-item-header__title">
            {i18n.t(`history:${revision.event}`)}
          </div>
          <div className="revision-item-header__separator">&mdash;</div>
          <div className="revision-item-header__author">{revision.author}</div>
        </div>
        <a
          className="revision-item-header__revert-button"
          href="#"
          onClick={revertHere}
        >
          <div className="revert-button__text">{i18n.t("history:revert")}</div>
          <i className="revert-button__icon fa fa-history" />
        </a>
      </div>
      <div className="revision-item__content">
        <div className="revision-item__content-box">
          <Diff revision={revision} diff={diff} cell={cell} />
        </div>
      </div>
    </div>
  );
};

const getTime = (dateString = "") => dateString.substr(11, 5);
export default withHandlers({ revertHere: () => () => null })(RevisionItem);
RevisionItem.propTypes = {
  langtag: PropTypes.string.isRequired,
  revision: PropTypes.object.isRequired,
  cell: validateProp(cellSpec)
};
