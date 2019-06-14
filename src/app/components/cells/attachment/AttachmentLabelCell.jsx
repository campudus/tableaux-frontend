import React from "react";
import PropTypes from "prop-types";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import Empty from "../../helperComponents/emptyEntry";
import f from "lodash/fp";
import apiUrl from "../../../helpers/apiUrl";
import { doto } from "../../../helpers/functools";

const AttachmentLabelCell = props => {
  const { attachmentElement, langtag, selected, openOverlay, editing } = props;

  const handleClick = evt => {
    if (editing && selected) {
      evt.stopPropagation();
      openOverlay(evt, attachmentElement.folder);
    } else if (!editing && selected) {
      // User can't change cell, so the edit dialog won't open. Since keeping
      // the editor closed will also keep the "preview" button ot of users'
      // reach, we preview the attachment if non-admin klicks the file name
      doto(
        attachmentElement,
        f.get("url"),
        retrieveTranslation(props.langtag),
        apiUrl,
        window.open
      );
    }
  };

  const attachmentTitle = retrieveTranslation(langtag, attachmentElement.title);

  return (
    <div className="link-label" onClick={handleClick}>
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
