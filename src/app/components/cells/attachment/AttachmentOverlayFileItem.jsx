import SvgIcon from "../../helperComponents/SvgIcon";
import { translate } from "react-i18next";
import i18n from "i18next";
import React from "react";

const FileItem = translate(["media", "common"])(props => {
  const { isLinked, toggleAttachment, title, url, editorUrl, style } = props;

  return (
    <div className="file-wrapper" style={style}>
      <div className={isLinked ? "file is-linked" : "file"}>
        <a onClick={toggleAttachment} className={"overlay-table-row"}>
          <i className="icon fa fa-file" />
          <span>{title}</span>
          {isLinked ? <SvgIcon icon="cross" /> : <SvgIcon icon="check" />}
        </a>
        <div className="media-options">
          <a className="file-link" href="#" onClick={() => window.open(url)}>
            <i className="icon fa fa-external-link" />
            {i18n.t("media:show_file")}
          </a>
          <a
            className="change-file"
            alt="edit"
            href="#"
            onClick={() => window.open(editorUrl)}
          >
            <i className="icon fa fa-pencil-square-o" />
            {i18n.t("media:change_file")}
          </a>
        </div>
      </div>
    </div>
  );
});

export default FileItem;
