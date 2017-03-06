import React from "react";
import AttachmentLabelCell from "../../cells/attachment/AttachmentLabelCell.jsx";

const AttachmentView = React.createClass({

  displayName: "AttachmentView",

  propTypes: {
    langtag: React.PropTypes.string.isRequired,
    cell: React.PropTypes.object.isRequired
  },

  render: function () {
    const {cell, langtag} = this.props;

    const attachments = cell.value.map((element, id) => {
      return <AttachmentLabelCell key={id} attachmentElement={element} cell={cell}
                                  langtag={langtag}
                                  deletable={false} />;
    });

    return (
      <div className='view-content link'>
        <a href="#" tabIndex={tabIdx} className="edit-links-button" onClick={this.openOverlay} ref={el => this.focusTarget = el}>
        {i18n.t("table:edit_attachments")}
      </a>
        <div className="link-list">
          {attachments}
        </div>
      </div>
    );
  }
}

export default AttachmentView;
