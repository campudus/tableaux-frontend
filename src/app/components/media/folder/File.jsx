import { translate } from "react-i18next";
import { withState } from "recompose";
import React, { Component } from "react";
import i18n from "i18next";

import PropTypes from "prop-types";

import {
  canUserDeleteFiles,
  canUserEditFiles,
  getUserLanguageAccess
} from "../../../helpers/accessManagementHelper";
import {
  confirmDeleteFile,
  noPermissionAlertWithLanguage
} from "../../../components/overlay/ConfirmationOverlay";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import FileEdit from "../overlay/FileEdit.jsx";
import Footer from "../../overlay/Footer";
import Header from "../../overlay/Header";
import apiUrl from "../../../helpers/apiUrl";

const enhance = withState("saveChanges", "setSaveChanges", false);

class File extends Component {
  onRemove = () => {
    if (canUserDeleteFiles()) {
      confirmDeleteFile(
        retrieveTranslation(this.props.langtag, this.props.file.title),
        () => {
          this.props.actions.deleteMediaFile(this.props.file.uuid);
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
    const { saveChanges, actions } = this.props;
    if (saveChanges && changeFileParams) {
      const fileId = changeFileParams[0];
      const requestData = {
        title: changeFileParams[1],
        description: changeFileParams[2],
        externalName: changeFileParams[3],
        internalName: changeFileParams[4],
        mimeType: changeFileParams[5],
        folder: changeFileParams[6]
      };

      actions.editMediaFile(fileId, requestData);
    }
    this.props.setSaveChanges(false);
  };

  onEdit = () => {
    const { file, langtag, actions } = this.props;

    if (!canUserEditFiles()) {
      const imageUrl = apiUrl(retrieveTranslation(langtag, file.url));
      window.open(imageUrl, "_blank");
      return;
    }

    actions.openOverlay({
      head: (
        <Header
          context={i18n.t("media:change_file")}
          title={retrieveTranslation(langtag, file.title)}
        />
      ),
      body: (
        <FileEdit
          fileId={file.uuid}
          langtag={langtag}
          onClose={this.onEditClose}
          actions={actions}
        />
      ),
      footer: (
        <Footer
          buttonActions={{
            neutral: [i18n.t("common:cancel"), null],
            positive: canUserEditFiles()
              ? [i18n.t("common:save"), this.onSave]
              : null
          }}
        />
      ),
      name: retrieveTranslation(langtag, file.title)
    });
  };

  onSave = () => {
    this.props.setSaveChanges(true);
  };

  render() {
    const { langtag, file, t } = this.props;

    const title = retrieveTranslation(langtag, file.title);
    const imageUrl = apiUrl(retrieveTranslation(langtag, file.url));

    // delete and edit file
    const mediaOptions = (
      <div className="media-options">
        {canUserEditFiles() && (
          <span onClick={this.onEdit} className="button" alt="edit">
            <i className="icon fa fa-pencil-square-o" />
            {t("change_file")}
          </span>
        )}
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="button"
        >
          <i className="icon fa fa-external-link" />
          {t("show_file")}
        </a>
        {canUserDeleteFiles() ? (
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

File.propTypes = {
  file: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  actions: PropTypes.object.isRequired
};

export default enhance(translate(["media"])(File));
