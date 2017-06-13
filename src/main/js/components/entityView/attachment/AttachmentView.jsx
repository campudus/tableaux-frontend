import React, {Component, PropTypes} from "react";
import ActionCreator from "../../../actions/ActionCreator";
import LinkList from "../../helperComponents/LinkList";
import {FallbackLanguage} from "../../../constants/TableauxConstants";
import multiLanguage from "../../../helpers/multiLanguage";
import i18n from "i18next";
import apiUrl from "../../../helpers/apiUrl";
import * as f from "lodash/fp";

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
    const translate = multiLanguage.retrieveTranslation(FallbackLanguage);

    const attachments = f.zip(cell.value, cell.displayValue).map(
      ([{url}, displayValue]) => (
        {
          displayName: displayValue[langtag],
          linkTarget: (f.isPlainObject(url)) ? apiUrl(translate(url, langtag)) : ""}
      )
    );

    return (f.isEmpty(attachments))
      ? <div className="item-description">{i18n.t("table:empty.attachments")}</div>
      : <div className="item-content link">
        <LinkList links={attachments} langtag={langtag} />
        {this.props.children}
      </div>;
  }
}

export default AttachmentView;
