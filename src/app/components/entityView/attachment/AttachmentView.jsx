import React, { Component } from "react";
import PropTypes from "prop-types";
import LinkList from "../../helperComponents/LinkList";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
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
    const { actions, cell } = this.props;
    const newValue = cell.value.filter(el => el.uuid !== uuid);
    actions.changeCellValue({ cell, newValue, oldValue: cell.value });
  };

  render() {
    const { cell, langtag, value, actions } = this.props;

    const attachments =
      f.size(value) === f.size(cell.displayValue)
        ? f.zip(value, cell.displayValue).map(([value, displayValue]) => ({
            ...value,
            id: value.uuid,
            displayName: displayValue[langtag],
            linkTarget: f.isPlainObject(value.url)
              ? apiUrl(retrieveTranslation(langtag, value.url))
              : ""
          }))
        : null;

    return f.isEmpty(attachments) ? (
      <div className="item-description">
        {i18n.t("table:empty.attachments")}
      </div>
    ) : (
      <div className="item-content link">
        <LinkList
          links={attachments}
          langtag={langtag}
          sortable
          cell={cell}
          value={value}
          actions={actions}
          isAttachment
        />
        {this.props.children}
      </div>
    );
  }
}

export default AttachmentView;
