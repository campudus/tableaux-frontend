import React, {Component, PropTypes} from "react";
import multiLanguage from "../../../helpers/multiLanguage";
import TableauxConstants from "../../../constants/TableauxConstants";
import {isLocked} from "../../../helpers/annotationHelper";
import classNames from "classnames";
import connectToAmpersand from "../../helperComponents/connectToAmpersand";

@connectToAmpersand
class AttachmentLabelCell extends Component {

  static propTypes = {
    cell: PropTypes.object.isRequired,
    attachmentElement: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    deletable: PropTypes.bool.isRequired,
    onDelete: PropTypes.func
  };

  removeAttachmentHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    this.props.onDelete(this.props.id);
  };

  render() {
    const {cell, deletable, attachmentElement, langtag} = this.props;
    const fallbackLang = TableauxConstants.DefaultLangtag;
    const retrieveTranslation = multiLanguage.retrieveTranslation(fallbackLang);
    const attachmentTitle = retrieveTranslation(attachmentElement.title, langtag);

    const hasDeleteButton = deletable && !isLocked(cell.row);
    const theClassName = classNames("link-label", {"delete": hasDeleteButton});
    const deleteButton = <i onClick={this.removeAttachmentHandler} className="fa fa-times" />;

    return (
      <div className={theClassName}>
        <div className="label-text">
          {attachmentTitle}
          {hasDeleteButton ? deleteButton : ""}
          </div>
      </div>
    );
  }

}

module.exports = AttachmentLabelCell;
