import i18n from "i18next";
import React from "react";

import PropTypes from "prop-types";
import moment from "moment";

import { calcRevisionDiff } from "./differ";
import Diff from "./diffItems/Diff";
import { DateTimeFormats } from "../../constants/TableauxConstants";

const ConfirmRevertOverlay = ({ cell, langtag, revision }) => {
  const diffLeft = calcRevisionDiff(cell, langtag, revision);

  // an "unchanged" diff, to display the value after reverting in the same style as the changes diff
  const diffRight = calcRevisionDiff(cell, langtag, {
    ...revision,
    prevContent: revision.fullFalue,
    prevDisplayValue: revision.displayValue
  });

  return (
    <div className="confirm-revert">
      <div className="confirm-revert__preview confirm-revert-preview__left">
        <div className="confirm-revert-preview__header">
          {i18n.t("history:changes-by-revert")}
        </div>
        <div className="revision-item__content">
          <Diff
            cell={cell}
            langtag={langtag}
            revision={revision}
            diff={diffLeft}
          />
        </div>
      </div>
      <div className="confirm-revert__preview confirm-revert-preview__right">
        <div className="confirm-revert-preview__header">
          {i18n.t("history:value-after-revert")}
        </div>
        <div className="revision-item__content">
          <Diff
            cell={cell}
            langtag={langtag}
            revision={revision}
            diff={diffRight}
          />
        </div>
        <div className="confirm-revert-preview__date-string">
          <div className="confirm-revert-preview__date">
            {i18n.t("history:revision-from")}
          </div>
          <div className="confirm-revert-preview__date">
            {moment(revision.timestamp).format(DateTimeFormats.formatForUser)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmRevertOverlay;
ConfirmRevertOverlay.propTypes = {
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  revision: PropTypes.object.isRequired
};
