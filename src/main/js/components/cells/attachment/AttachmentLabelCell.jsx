import React, {Component, PropTypes} from "react";
import multiLanguage from "../../../helpers/multiLanguage";
import TableauxConstants from "../../../constants/TableauxConstants";
import connectToAmpersand from "../../helperComponents/connectToAmpersand";

@connectToAmpersand
class AttachmentLabelCell extends Component {

  static propTypes = {
    cell: PropTypes.object.isRequired,
    attachmentElement: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired
  };

  render() {
    const {attachmentElement, langtag} = this.props;
    const fallbackLang = TableauxConstants.DefaultLangtag;
    const retrieveTranslation = multiLanguage.retrieveTranslation(fallbackLang);
    const attachmentTitle = retrieveTranslation(attachmentElement.title, langtag);

    return (
      <div className="link-label">
        <div className="label-text">
          {attachmentTitle}
        </div>
      </div>
    );
  }

}

module.exports = AttachmentLabelCell;
