import React from "react";
import PropTypes from "prop-types";
import AttachmentLabelCell from "./AttachmentLabelCell.jsx";
import * as f from "lodash/fp";
import classNames from "classnames";
import Header from "../../overlay/Header";
import AttachmentOverlay from "./AttachmentOverlay.jsx";
import { isLocked } from "../../../helpers/annotationHelper";
import { maybe } from "../../../helpers/functools";
import { doto } from "../../../helpers/functools";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import apiUrl from "../../../helpers/apiUrl";
import { canUserChangeCell } from "../../../helpers/accessManagementHelper";

const AttachmentCell = props => {
  const {
    actions,
    cell,
    editing,
    selected,
    cell: { value },
    langtag
  } = props;
  const cellClass = classNames("cell-content", {
    editing: editing,
    selected: selected
  });

  const handleAttachmentLabelClick = (attachmentElement) => (event) => {
    if (!isLocked(cell.row) && canUserChangeCell(cell, langtag)) {
      openOverlay(event, attachmentElement.folder)
    } else {
      doto(
        attachmentElement,
        f.get("url"),
        retrieveTranslation(props.langtag),
        apiUrl,
        window.open
      );
    }
  }

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

  const attachments = (editing && selected ? value : f.take(3)(value)).map(
    (element, idx) => (
      <AttachmentLabelCell
        key={idx}
        attachmentElement={element}
        value={value}
        langtag={langtag}
        openOverlay={openOverlay}
        selected={selected}
        cell={cell}
        editing={editing}
        handleClick={handleAttachmentLabelClick}
      />
    )
  );

  const allAttachmentsHaveSameFolderId = (attachments) => {
    return f.compose(
      f.eq(1),
      f.size,
      f.uniq,
      f.map((attachment) => attachment.folder)
    )(attachments)
  }

  const handleClick = e => {

    if (editing && selected) {
      if (allAttachmentsHaveSameFolderId(value)) {
        openOverlay(e, f.get("folder", f.head(value)));
      } else {
        openOverlay(e);
      }

    }
  };

  return (
    <div className={cellClass} onClick={handleClick}>
      {f.size(attachments) === f.size(value)
        ? attachments
        : [
          ...attachments,
          <span key={"more"} className="more">
            &hellip;
          </span>
        ]}
      {editing && selected ? (
        <button key={"add-btn"} className="edit" onClick={handleClick}>
          <span className="fa fa-pencil" />
        </button>
      ) : null}
    </div>
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
