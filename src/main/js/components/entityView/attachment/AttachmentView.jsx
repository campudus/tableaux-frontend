import React, {Component, PropTypes} from "react";
import ActionCreator from "../../../actions/ActionCreator";
import LinkList from "../../helperComponents/LinkList";
import {FallbackLanguage} from "../../../constants/TableauxConstants";
import multiLanguage from "../../../helpers/multiLanguage";
import {isEmpty} from "lodash/fp";
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

  render() {
    const {cell, langtag} = this.props;

    const attachments = cell.value.map(
      ({title}, idx) => {
        const translate = multiLanguage.retrieveTranslation(FallbackLanguage);
        const displayName = translate(title, langtag);
        return {displayName}
      }
    );

    return (isEmpty(attachments))
      ? <div className="item-description">{i18n.t("table:empty.attachments")}</div>
      : <div className="item-content link">
        <LinkList links={attachments} langtag={langtag} />
        {this.props.children}
      </div>
  }
}

export default AttachmentView;
