import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import Dropzone from "react-dropzone";
import request from "superagent";
import apiUrl from "../../../helpers/apiUrl";
import ProgressBar from "../ProgressBar.jsx";
import FileIcon from "../folder/FileIcon.jsx";
import { hasUserAccessToLanguage } from "../../../helpers/accessManagementHelper";
import { DefaultLangtag } from "../../../constants/TableauxConstants";
import { translate } from "react-i18next";

@translate(["media"])
class FileChangeUpload extends PureComponent {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    internalFileName: PropTypes.string,
    uuid: PropTypes.string.isRequired,
    isSingleFile: PropTypes.bool,
    actions: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = { uploadProgress: null };
  }

  onDrop = files => {
    const { langtag, uuid } = this.props;

    files.forEach(file => {
      const uploadUrl = apiUrl("/files/" + uuid + "/" + langtag);
      this.setState({
        uploadProgress: 0
      });
      request
        .put(uploadUrl)
        .on("progress", e => {
          this.setState({
            uploadProgress: parseInt(e.percent)
          });
        })
        .attach("file", file, file.name)
        .end(this.uploadCallback);
    });
  };

  uploadCallback = (err, res) => {
    this.setState({
      uploadProgress: null
    });

    if (err) {
      console.error("FileUpload.uploadCallback", err);
      return;
    }

    if (res) {
      this.props.actions.getMediaFile(this.props.uuid);
    }
  };

  render() {
    const { langtag, internalFileName, isSingleFile } = this.props;
    const { uploadProgress } = this.state;
    const { t } = this.props;

    if (
      (isSingleFile && hasUserAccessToLanguage(DefaultLangtag)) ||
      (!isSingleFile && hasUserAccessToLanguage(langtag))
    ) {
      const progressBar = uploadProgress ? (
        <ProgressBar progress={uploadProgress} />
      ) : null;
      return (
        <Dropzone onDrop={this.onDrop} className="dropzone" multiple={false}>
          {progressBar}
          <FileIcon internalFileName={internalFileName} />
          <span className="replace-note">{t("replace_existing_file")}</span>
        </Dropzone>
      );
    } else {
      return (
        <div className="no-permission-upload-file">
          <FileIcon internalFileName={internalFileName} />
        </div>
      );
    }
  }
}

module.exports = FileChangeUpload;
