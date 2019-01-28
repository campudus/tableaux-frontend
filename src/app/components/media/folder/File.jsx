import React, { Component } from "react";
import PropTypes from "prop-types";
import i18n from "i18next";
import { withState } from "recompose";
import apiUrl from "../../../helpers/apiUrl";
import multiLanguage from "../../../helpers/multiLanguage";

import FileEdit from "../overlay/FileEdit.jsx";
import Header from "../../overlay/Header";
import Footer from "../../overlay/Footer";

import TableauxConstants from "../../../constants/TableauxConstants";
import {
  getUserLanguageAccess,
  isUserAdmin
} from "../../../helpers/accessManagementHelper";
import {
  confirmDeleteFile,
  noPermissionAlertWithLanguage
} from "../../../components/overlay/ConfirmationOverlay";
import { translate } from "react-i18next";

const enhance = withState("saveChanges", "setSaveChanges", false);

@translate(["media"])
class File extends Component {
  static propTypes = {
    file: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    t: PropTypes.func,
    actions: PropTypes.object
  };

  onRemove = () => {
    const fallbackLang = TableauxConstants.DefaultLangtag;
    const retrieveTranslation = multiLanguage.retrieveTranslation(fallbackLang);

    if (isUserAdmin()) {
      confirmDeleteFile(
        retrieveTranslation(this.props.file.title, this.props.langtag),
        () => {
          // TODO-W
          console.log("File.onRemove", this.props.file.uuid);
        },
        this.props.actions
      );
    } else {
      noPermissionAlertWithLanguage(
        getUserLanguageAccess(),
        null,
        this.props.actions
      );
    }
  };

  onEditClose = changeFileParams => {
    // TODO-W
    if (this.props.saveChanges && changeFileParams) {
      console.log(
        "save new Filedata",
        this.props.saveChanges,
        changeFileParams
      );
    }
    this.props.setSaveChanges(false);
  };

  onEdit = () => {
    const { file, langtag, actions } = this.props;
    const { FallbackLanguage } = TableauxConstants;
    const retrieveTranslation = multiLanguage.retrieveTranslation(
      FallbackLanguage
    );

    actions.openOverlay({
      head: (
        <Header
          context={i18n.t("media:change_file")}
          title={retrieveTranslation(file.title, langtag)}
        />
      ),
      body: (
        <FileEdit file={file} langtag={langtag} onClose={this.onEditClose} />
      ),
      footer: (
        <Footer
          buttonActions={{
            negative: [i18n.t("common:save"), this.onSave],
            neutral: [i18n.t("common:cancel"), null]
          }}
        />
      ),
      name: retrieveTranslation(file.title, langtag)
    });
  };

  onSave = () => {
    this.props.setSaveChanges(true);
  };

  render() {
    const { langtag, file, t } = this.props;
    const fallbackLang = TableauxConstants.DefaultLangtag;
    const translate = multiLanguage.retrieveTranslation(fallbackLang);

    const title = translate(file.title, langtag);
    const imageUrl = apiUrl(translate(file.url, langtag));

    // delete and edit file
    const mediaOptions = (
      <div className="media-options">
        <span onClick={this.onEdit} className="button" alt="edit">
          <i className="icon fa fa-pencil-square-o" />
          {t("change_file")}
        </span>
        <a href={imageUrl} target="_blank" rel="noopener" className="button">
          <i className="icon fa fa-external-link" />
          {t("show_file")}
        </a>
        {isUserAdmin() ? (
          <span
            className="button"
            onClick={this.onRemove}
            alt={t("delete_file")}
          >
            <i className="fa fa-trash" />
          </span>
        ) : null}
      </div>
    );

    return (
      <div key={"file" + this.props.file.uuid} className="file">
        <a
          className="file-link"
          onClick={this.onEdit}
          rel="noopener"
          target="_blank"
        >
          <i className="icon fa fa-file" />
          <span>{title}</span>
        </a>
        {mediaOptions}
      </div>
    );
  }
}

export default enhance(File);
