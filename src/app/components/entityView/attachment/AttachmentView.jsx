import React from "react";
import PropTypes from "prop-types";
import LinkList from "../../helperComponents/LinkList";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import i18n from "i18next";
import apiUrl from "../../../helpers/apiUrl";
import * as f from "lodash/fp";

const AttachmentView = ({ actions, cell, children, langtag, value }) => {
  const attachments =
    f.size(value) <= f.size(cell.displayValue)
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
    <div className="item-description">{i18n.t("table:empty.attachments")}</div>
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
      {children}
    </div>
  );
};

AttachmentView.propTypes = {
  cell: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  actions: PropTypes.object.isRequired,
  value: PropTypes.array.isRequired
};

export default AttachmentView;
