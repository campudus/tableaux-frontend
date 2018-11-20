import React from "react";
import PropTypes from "prop-types";
import AttachmentLabelCell from "./AttachmentLabelCell.jsx";
import * as f from "lodash/fp";
import classNames from "classnames";
// import ActionCreator from "../../../actions/ActionCreator";
import Header from "../../overlay/Header";
import AttachmentOverlay from "./AttachmentOverlay.jsx";
// import OverlayHeadRowIdentificator from "../../overlay/OverlayHeadRowIdentificator.jsx";
import {FallbackLanguage} from "../../../constants/TableauxConstants";
import {isLocked} from "../../../helpers/annotationHelper";
import {maybe} from "../../../helpers/functools";
import {pure} from "recompose";

const AttachmentCell = (props) => {
  const {editing, selected, cell, langtag, setCellKeyboardShortcuts} = props;
  const cellClass = classNames("cell-content", {
    "editing": editing,
    "selected": selected
  });

  const openOverlay = (event, folderId) => {
    if (isLocked(cell.row)) {
      return;
    }
    maybe(event).method("stopPropagation");
    const columnName = cell.column.displayName[langtag] || cell.column.displayName[FallbackLanguage];
    // ActionCreator.openOverlay({
    //   head: <Header title={<OverlayHeadRowIdentificator cell={cell} langtag={langtag} />} context={columnName} />,
    //   body: <AttachmentOverlay cell={cell} langtag={langtag} folderId={folderId} />,
    //   type: "full-height",
    //   preferRight: true
    // });
  };

  const attachments = ((editing || selected) ? cell.value : f.take(3)(cell.value))
    .map(
      (element, idx) => (
        <AttachmentLabelCell
          key={idx}
          attachmentElement={element}
          cell={cell}
          langtag={langtag}
          openOverlay={openOverlay}
          selected={selected}
        />
      ),
    );

  // setCellKeyboardShortcuts(
  //   {
  //     enter: (event) => {
  //       if (!isLocked(cell.row)) {
  //         event.stopPropagation();
  //         event.preventDefault();
  //         openOverlay();
  //       }
  //     }
  //   }
  // );

  const handleClick = () => {
    if (editing || selected) {
      openOverlay();
    }
  };

  return (
    <div className={cellClass} onClick={handleClick}>
      {(f.size(attachments) === f.size(cell.value))
        ? attachments
        : [...attachments, <span key={"more"} className="more">&hellip;</span>]
      }
      {(editing || selected)
        ? <button key={"add-btn"} className="edit" onClick={openOverlay}><span className="fa fa-pencil"></span></button>
        : null
      }
    </div>
  );
};

AttachmentCell.propTypes = {
  editing: PropTypes.bool,
  selected: PropTypes.bool,
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  setCellKeyboardShortcuts: PropTypes.func.isRequired
};

export default pure(AttachmentCell);
