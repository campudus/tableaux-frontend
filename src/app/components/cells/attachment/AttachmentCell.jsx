import React, { useMemo } from "react";
import PropTypes from "prop-types";
import AttachmentLabelCell from "./AttachmentLabelCell.jsx";
import * as f from "lodash/fp";
import classNames from "classnames";
import Header from "../../overlay/Header";
import AttachmentOverlay from "./AttachmentOverlay.jsx";
import { isLocked } from "../../../helpers/rowUnlock";
import { maybe } from "../../../helpers/functools";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import apiUrl from "../../../helpers/apiUrl";
import { canUserChangeCell } from "../../../helpers/accessManagementHelper";
import { getVisibleLinkCount } from "../link/getVisibleLinkCount";

const AttachmentCell = props => {
  const {
    actions,
    cell,
    editing,
    selected,
    cell: { value },
    langtag,
    width
  } = props;
  const cellClass = classNames("cell-content", {
    editing: editing,
    selected: selected
  });
  const previewAttachmentCount = useMemo(() => {
    const currentLangDisplayValues = f.map(f.get(["title", langtag]), value);
    return getVisibleLinkCount(currentLangDisplayValues, width);
  }, [width]);

  const tooManyAttachments = f.size(value) > previewAttachmentCount;

  const viewAttachment = attachment =>
    f.flow(
      f.get("url"),
      retrieveTranslation(props.langtag),
      apiUrl,
      window.open
    )(attachment);

  const handleAttachmentLabelClick = attachmentElement => event => {
    if (!isLocked(cell.row) && canUserChangeCell(cell, langtag)) {
      openOverlay(event, attachmentElement.folder);
    } else {
      viewAttachment(attachmentElement);
    }
  };

  const openOverlay = (event, folderId) => {
    maybe(event).method("stopPropagation");

    actions.openOverlay({
      head: <Header langtag={langtag} />,
      body: (
        <AttachmentOverlay
          cell={cell}
          langtag={langtag}
          folderId={folderId}
          value={value}
        />
      ),
      type: "full-height",
      preferRight: true,
      title: cell
    });
  };

  const attachments = (editing || selected
    ? value
    : f.take(previewAttachmentCount)(value)
  ).map((element, idx) => (
    <AttachmentLabelCell
      key={idx}
      attachmentElement={element}
      value={value}
      langtag={langtag}
      openOverlay={openOverlay}
      selected={selected}
      cell={cell}
      editing={editing}
      handleClick={editing || selected ? handleAttachmentLabelClick : f.noop}
    />
  ));

  const allAttachmentsHaveSameFolderId = attachments => {
    return f.compose(
      f.eq(1),
      f.size,
      f.uniq,
      f.map(attachment => attachment.folder)
    )(attachments);
  };

  const handleClick = e => {
    if (
      !isLocked(cell.row) &&
      canUserChangeCell(cell, langtag) &&
      (editing || selected)
    ) {
      if (allAttachmentsHaveSameFolderId(value)) {
        openOverlay(e, f.get("folder", f.head(value)));
      } else {
        openOverlay(e);
      }
    }
  };

  return (
    <>
      <div className={cellClass} onClick={handleClick}>
        {tooManyAttachments && !selected && !editing
          ? [
              ...attachments,
              <span key={"more"} className="more">
                &hellip;
              </span>
            ]
          : attachments}
      </div>
      {(editing || selected) && !isLocked(cell.row) && (
        <button key={"add-btn"} className="edit" onClick={handleClick}>
          <span className="fa fa-pencil" />
        </button>
      )}
    </>
  );
};

AttachmentCell.propTypes = {
  actions: PropTypes.object.isRequired,
  cell: PropTypes.object.isRequired,
  editing: PropTypes.bool,
  langtag: PropTypes.string.isRequired,
  selected: PropTypes.bool
};

export default AttachmentCell;
