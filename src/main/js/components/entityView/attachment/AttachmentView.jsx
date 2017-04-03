import React, {Component, PropTypes} from "react";
import AttachmentLabelCell from "../../cells/attachment/AttachmentLabelCell.jsx";
import ActionCreator from "../../../actions/ActionCreator";
import OverlayHeadRowIdentificator from "../../overlay/OverlayHeadRowIdentificator";
import AttachmentOverlay from "../../cells/attachment/AttachmentOverlay";
import i18n from "i18next";

class AttachmentView extends Component {

  constructor(props) {
    super(props);
    this.displayName = "AttachmentView";
  }

  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired,
    tabIdx: PropTypes.number
  };

  removeAttachment = uuid => () => {
    const {cell} = this.props;
    const newValue = cell.value.filter(el => el.uuid !== uuid);
    ActionCreator.changeCell(cell, newValue);
  };

  openOverlay = () => {
    const {cell, langtag} = this.props;
    ActionCreator.openOverlay({
      head: <OverlayHeadRowIdentificator cell={cell} langtag={langtag} />,
      body: <AttachmentOverlay cell={cell} langtag={langtag} />,
      type: "normal"
    });
  };

  render() {
    const {cell, langtag, tabIdx} = this.props;

    const attachments = cell.value.map((element, id) => {
      return <AttachmentLabelCell key={id} attachmentElement={element} cell={cell}
                                  langtag={langtag}
                                  deletable={true}
                                  onDelete={this.removeAttachment(element.uuid)}
      />;
    });

    return (
      <div className='view-content link'>
        <a href="#" tabIndex={tabIdx} className="edit-links-button" onClick={this.openOverlay}>
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
