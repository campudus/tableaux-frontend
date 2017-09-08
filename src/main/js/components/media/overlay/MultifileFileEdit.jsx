import apiUrl from "../../../helpers/apiUrl";
import LanguageSwitcher from "../../header/LanguageSwitcher.jsx";
import FileChangeUpload from "./FileChangeUpload.jsx";
import React, {PureComponent} from "react";
import PropTypes from "prop-types";
import {getUserLanguageAccess, hasUserAccessToLanguage} from "../../../helpers/accessManagementHelper";
import {translate} from "react-i18next";

class MultifileFileEdit extends PureComponent {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    originalLangtag: PropTypes.string.isRequired,
    fileData: PropTypes.object.isRequired,
    onTitleChange: PropTypes.func.isRequired,
    onDescriptionChange: PropTypes.func.isRequired,
    onExternalnameChange: PropTypes.func.isRequired,
    onLangChange: PropTypes.func.isRequired
  };

  componentWillMount() {
    this.titleId = "fileTitle_" + this.props.langtag;
    this.descId = "fileDescription_" + this.props.langtag;
    this.externalNameId = "fileLinkName" + this.props.langtag;
  }

  onTitleChange = (event) => {
    this.props.onTitleChange(event.target.value, this.props.originalLangtag);
  };

  onDescriptionChange = (event) => {
    this.props.onDescriptionChange(event.target.value, this.props.originalLangtag);
  };

  onExternalNameChange = (event) => {
    this.props.onExternalnameChange(event.target.value, this.props.originalLangtag);
  };

  onLangChange = (lang) => {
    this.props.onLangChange(lang, this.props.originalLangtag);
  };

  render() {
    const {langtag, fileData, t} = this.props;
    const {internalName, uuid, description, externalName, title, fileUrl} = fileData;
    const permissionToChange = hasUserAccessToLanguage(langtag);

    const openFileLink = (internalName && fileUrl)
      ? (
        <span className="open-file">
          <a target="_blank"
            rel="noopener"
            href={apiUrl(fileUrl)}
          >
            {t("open_file")}
          </a>
        </span>
      )
      : null;

    return (
      <div className="multifile-file-edit item">
        <div className="cover-wrapper">
          <div className="cover">
            <FileChangeUpload
              langtag={langtag}
              internalFileName={internalName}
              uuid={uuid} />
          </div>
          {openFileLink}
        </div>
        <div className="properties-wrapper">
          <LanguageSwitcher
            langtag={langtag}
            onChange={this.onLangChange}
            disabled={!permissionToChange}
            limitLanguages={getUserLanguageAccess()}
          />
          <div className="item">
            <div className="item-header">{t("file_title_label")}</div>
            <input disabled={!permissionToChange} type="text" id={this.titleId}
              value={title}
              onChange={this.onTitleChange} />
          </div>
          <div className="item">
            <div className="item-header">{t("file_description_label")}</div>
            <input disabled={!permissionToChange} type="text" id={this.descId}
              value={description}
              onChange={this.onDescriptionChange} />
          </div>
          <div className="item">
            <div className="item-header">{t("file_link_name_label")}</div>
            <input disabled={!permissionToChange} type="text" id={this.externalNameId}
              value={externalName}
              onChange={this.onExternalNameChange} />
          </div>
        </div>
      </div>
    );
  }
};

module.exports = translate(["media"])(MultifileFileEdit);
