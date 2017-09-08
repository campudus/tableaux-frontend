import React, {} from "react";
import PropTypes from "prop-types";
import multiLanguage from "../../../helpers/multiLanguage";
import TableauxConstants from "../../../constants/TableauxConstants";

const AttachmentLabelCell = (props) => {
  const {attachmentElement, langtag, selected, openOverlay} = props;

  const handleClick = (evt) => {
    if (selected) {
      evt.stopPropagation();
      openOverlay(evt, attachmentElement.folder);
    }
  };

  const fallbackLang = TableauxConstants.DefaultLangtag;
  const retrieveTranslation = multiLanguage.retrieveTranslation(fallbackLang);
  const attachmentTitle = retrieveTranslation(attachmentElement.title, langtag);

  return (
    <div className="link-label" onClick={handleClick}>
      <div className="label-text">
        {attachmentTitle}
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

module.exports = AttachmentLabelCell;
