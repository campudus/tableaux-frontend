import { translate } from "react-i18next";
import Dropzone from "react-dropzone";
import React, { PureComponent } from "react";

import PropTypes from "prop-types";

import { DefaultLangtag } from "../../../constants/TableauxConstants";
import { canUserEditFiles } from "../../../helpers/accessManagementHelper";
import { makeRequest } from "../../../helpers/apiHelper";
import FileIcon from "../folder/FileIcon.jsx";
import ProgressBar from "../ProgressBar.jsx";
import route from "../../../helpers/apiRoutes";

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
      const uploadUrl = route.toFile() + "/" + uuid + "/" + langtag;
      const onProgress = progress => {
        this.setState({ uploadProgress: parseInt(progress.percent) });
      };

      this.setState({
        uploadProgress: 0
      });

      makeRequest({ method: "PUT", apiRoute: uploadUrl, file, onProgress });
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
      // on success reload file from api into state
      this.props.actions.getMediaFile(this.props.uuid);
    }
  };

  render() {
    const { langtag, internalFileName, isSingleFile } = this.props;
    const { uploadProgress } = this.state;
    const { t } = this.props;

    if (
      (isSingleFile && canUserEditFiles(DefaultLangtag)) ||
      (!isSingleFile && canUserEditFiles(langtag))
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

export default translate(["media"])(FileChangeUpload);
