import React from "react";
import PropTypes from "prop-types";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import Empty from "../../helperComponents/emptyEntry";
import f from "lodash/fp";

const AttachmentLabelCell = props => {
  const { attachmentElement, langtag, handleClick } = props;

  const attachmentTitle = retrieveTranslation(langtag, attachmentElement.title);

  return (
    <div className="link-label" onClick={handleClick(attachmentElement)}>
      <div className="label-text">
        {f.isEmpty(attachmentTitle) ? <Empty /> : attachmentTitle}
      </div>
    </div>
  );
};

AttachmentLabelCell.propTypes = {
  cell: PropTypes.object.isRequired,
  attachmentElement: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  openOverlay: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired
};

export default AttachmentLabelCell;
