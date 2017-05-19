import React, {Component, PropTypes} from "react";
import multiLanguage from "../../../helpers/multiLanguage";
import TableauxConstants from "../../../constants/TableauxConstants";

class AttachmentLabelCell extends Component {

  static propTypes = {
    cell: PropTypes.object.isRequired,
    attachmentElement: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    openOverlay: PropTypes.func.isRequired,
    selected: PropTypes.bool.isRequired
  };

  handleClick = evt => {
    if (this.props.selected) {
      evt.stopPropagation();
      this.props.openOverlay(this.props.attachmentElement.folder);
    }
  };

  render() {
    const {attachmentElement, langtag} = this.props;
    const fallbackLang = TableauxConstants.DefaultLangtag;
    const retrieveTranslation = multiLanguage.retrieveTranslation(fallbackLang);
    const attachmentTitle = retrieveTranslation(attachmentElement.title, langtag);

    return (
      <div className="link-label" onClick={this.handleClick}>
        <div className="label-text">
          {attachmentTitle}
        </div>
      </div>
    );
  }

}

module.exports = AttachmentLabelCell;
