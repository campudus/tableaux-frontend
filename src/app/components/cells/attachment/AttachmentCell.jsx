import React from "react";
import PropTypes from "prop-types";
import AttachmentLabelCell from "./AttachmentLabelCell.jsx";
import * as f from "lodash/fp";
import classNames from "classnames";
import Header from "../../overlay/Header";
import AttachmentOverlay from "./AttachmentOverlay.jsx";
import { isLocked } from "../../../helpers/annotationHelper";
import { maybe } from "../../../helpers/functools";

const AttachmentCell = props => {
  const {
    actions,
    cell,
    editing,
    selected,
    cell: { value },
    langtag,
    setCellKeyboardShortcuts
  } = props;
  const cellClass = classNames("cell-content", {
    editing: editing,
    selected: selected
  });

  const openOverlay = (event, folderId) => {
    if (isLocked(cell.row)) {
      return;
    }
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

  const attachments = (editing || selected ? value : f.take(3)(value)).map(
    (element, idx) => (
      <AttachmentLabelCell
        key={idx}
        attachmentElement={element}
        value={value}
        langtag={langtag}
        openOverlay={openOverlay}
        selected={selected}
        cell={cell}
      />
    )
  );

  setCellKeyboardShortcuts({
    enter: event => {
      if (!isLocked(cell.row)) {
        event.stopPropagation();
        event.preventDefault();
        openOverlay();
      }
    }
  });

  const handleClick = e => {
    if (editing || selected) {
      openOverlay(e);
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
      {editing || selected ? (
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
  selected: PropTypes.bool,
  setCellKeyboardShortcuts: PropTypes.func.isRequired
};

export default AttachmentCell;
