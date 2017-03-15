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

    var attachments = cell.value.map(function (element, id) {
      return <AttachmentLabelCell key={id} attachmentElement={element} cell={cell}
                                  langtag={langtag}
                                  deletable={false} />;
    });

    return (
      <div className='view-content link'>
        {attachments}
      </div>
    );
  }
});

export default AttachmentView;
