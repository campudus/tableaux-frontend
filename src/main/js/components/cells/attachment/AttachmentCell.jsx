import React, {Component, PropTypes} from "react";
import AttachmentLabelCell from "./AttachmentLabelCell.jsx";
import AttachmentEditCell from "./AttachmentEditCell.jsx";
import * as f from "lodash/fp";

class AttachmentCell extends Component {

  static propTypes = {
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    selected: PropTypes.bool.isRequired,
    editing: PropTypes.bool.isRequired,
    setCellKeyboardShortcuts: PropTypes.func
  };

  render() {
    const {editing, selected, cell, langtag, setCellKeyboardShortcuts} = this.props;

    if (selected) {
      return <AttachmentEditCell cell={cell} langtag={langtag}
                                 editing={editing}
                                 setCellKeyboardShortcuts={setCellKeyboardShortcuts}
      />;
    } else {
      // Show an attachment preview for performance
      const tooManyAttachments = cell.value.length > 3;
      const attachments = f.take(3, cell.value)
                           .map((element, id) => {
                             return <AttachmentLabelCell key={id} attachmentElement={element} cell={cell}
                                                         langtag={langtag}
                                                         deletable={false}
                             />;
                           });
      return (
        <div className={"cell-content"}>
          {(tooManyAttachments) ? [...attachments, <span key={"more"} className="more">&hellip;</span>] : attachments}
        </div>
      );
    }
  }

}

module.exports = AttachmentCell;
