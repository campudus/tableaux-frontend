import React, {Component} from "react";
import PropTypes from "prop-types";
import connectToAmpersand from "../../helperComponents/connectToAmpersand";
import apiUrl from "../../../helpers/apiUrl";
import multiLanguage from "../../../helpers/multiLanguage";
import Dispatcher from "../../../dispatcher/Dispatcher";
import FileEdit from "../overlay/FileEdit.jsx";

import Header from "../../overlay/Header";
import Footer from "../../overlay/Footer";

import TableauxConstants from "../../../constants/TableauxConstants";
import ActionCreator from "../../../actions/ActionCreator";
import {getUserLanguageAccess, isUserAdmin} from "../../../helpers/accessManagementHelper";
import {confirmDeleteFile, noPermissionAlertWithLanguage} from "../../../components/overlay/ConfirmationOverlay";
import {translate} from "react-i18next";
import i18n from "i18next";

@translate(["media"])
@connectToAmpersand
class File extends Component {

  static propTypes = {
    file: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired
  };

  onRemove = () => {
    const fallbackLang = TableauxConstants.DefaultLangtag;
    const retrieveTranslation = multiLanguage.retrieveTranslation(fallbackLang);

    if (isUserAdmin()) {
      confirmDeleteFile(
        retrieveTranslation(this.props.file.title, this.props.langtag),
        () => {
          console.log("File.onRemove", this.props.file.uuid);
          ActionCreator.removeFile(this.props.file.uuid);
          ActionCreator.closeOverlay();
        },
        () => {
          ActionCreator.closeOverlay();
        });
    } else {
      noPermissionAlertWithLanguage(getUserLanguageAccess());
    }
  };

  onSave = () => {
    Dispatcher.trigger("on-media-overlay-save");
  };

  onCancel = () => {
    Dispatcher.trigger("on-media-overlay-cancel");
  };

  onEdit = () => {
    const {file, langtag, t} = this.props;
    const {FallbackLanguage} = TableauxConstants;
    ActionCreator.openOverlay({
      head: <Header context={t("change_file")}
                    title={multiLanguage.retrieveTranslation(FallbackLanguage)(file.title, langtag)}
      />,
      body: <FileEdit file={this.props.file} langtag={this.props.langtag} onClose={this.onEditClose} />,
      footer: (
        <Footer actions={{positive: [i18n.t("common:save"), this.onSave], neutral: [i18n.t("common:close"), null]}}
        />
      )
    });
  };

  onEditClose = (event) => {
    ActionCreator.closeOverlay();
  };

  render() {
    // default language (for fallback)
    const fallbackLang = TableauxConstants.DefaultLangtag;
    const retrieveTranslation = multiLanguage.retrieveTranslation(fallbackLang);

    // current language
    const langtag = this.props.langtag;
    const title = retrieveTranslation(this.props.file.title, langtag);
    const imageUrl = apiUrl(retrieveTranslation(this.props.file.fileUrl, langtag));

    const {t} = this.props;

    // delete and edit file
    let mediaOptions = (
      <div className="media-options">
          <span onClick={this.onEdit} className="button" alt="edit">
          <i className="icon fa fa-pencil-square-o" />{t("change_file")}
        </span>
        <a href={imageUrl} target="_blank" rel="noopener" className="button">
          <i className="icon fa fa-external-link" />{t("show_file")}
        </a>
        {isUserAdmin() ? (
          <span className="button" onClick={this.onRemove} alt={t("delete_file")}><i className="fa fa-trash"></i></span>
        ) : null}
      </div>);

    return (
      <div key={"file" + this.props.file.uuid} className="file">
        <a className="file-link" onClick={this.onEdit} rel="noopener" target="_blank">
          <i className="icon fa fa-file" /><span>{title}</span></a>
        {mediaOptions}
      </div>
    );
  }
}

export default File;
