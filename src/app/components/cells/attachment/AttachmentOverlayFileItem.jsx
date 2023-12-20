import SvgIcon from "../../helperComponents/SvgIcon";
import { translate } from "react-i18next";
import i18n from "i18next";
import React from "react";

const FileItem = translate(["media", "common"])(props => {
  const { isLinked, toggleAttachment, title, url, editorUrl, style } = props;

  return (
    <div className="file-wrapper" style={style}>
      <div className={isLinked ? "file is-linked" : "file"}>
        <button onClick={toggleAttachment} className={"overlay-table-row"}>
          <i className="icon fa fa-file" />
          <span>{title}</span>
          {isLinked ? <SvgIcon icon="cross" /> : <SvgIcon icon="check" />}
        </button>
        <div className="media-options">
          <button className="file-link" onClick={() => window.open(url)}>
            <i className="icon fa fa-external-link" />
            {i18n.t("media:show_file")}
          </button>
          <button
            className="change-file"
            alt="edit"
            onClick={() => window.open(editorUrl)}
          >
            <i className="icon fa fa-pencil-square-o" />
            {i18n.t("media:change_file")}
          </button>
        </div>
      </div>
    </div>
  );
});

export default FileItem;
