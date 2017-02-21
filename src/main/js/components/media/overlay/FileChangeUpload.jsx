import React from "react";
import Dropzone from "react-dropzone";
import request from "superagent";
import withAbortableXhrRequest from "../../HOCs/withAbortableXhrRequests";
import apiUrl from "../../../helpers/apiUrl";
import ActionCreator from "../../../actions/ActionCreator";
import ProgressBar from "../ProgressBar.jsx";
import FileIcon from "../folder/FileIcon.jsx";
import {hasUserAccessToLanguage} from "../../../helpers/accessManagementHelper";
import {DefaultLangtag} from "../../../constants/TableauxConstants";
import {translate} from "react-i18next";

@translate(["media"])
@withAbortableXhrRequest
class FileChangeUpload extends React.Component {
  static propTypes = {
    langtag: React.PropTypes.string.isRequired,
    internalFileName: React.PropTypes.string,
    uuid: React.PropTypes.string.isRequired,
    isSingleFile: React.PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.state = {uploadProgress: null};
  }

  onDrop = (files) => {
    const {langtag, uuid} = this.props;

    files.forEach((file) => {
      const uploadUrl = apiUrl("/files/" + uuid + "/" + langtag);
      this.setState({
        uploadProgress: 0
      });
      const req = request
        .put(uploadUrl)
        .on('progress', (e) => {
          this.setState({
            uploadProgress: parseInt(e.percent)
          });
        })
        .attach("file", file, file.name)
        .end(this.uploadCallback);

      this.props.addAbortableXhrRequest(req.xhr);
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
      const file = res.body;
      ActionCreator.changedFileData(file.uuid,
        file.title,
        file.description,
        file.externalName,
        file.internalName,
        file.mimeType,
        file.folder,
        file.url);
    }
  };


  render() {
    const {langtag, internalFileName, isSingleFile} = this.props;
    const {uploadProgress} = this.state;
    const {t} = this.props;

    console.log("DefaultLangtag:",
      DefaultLangtag,
      "isSingleFile: ",
      isSingleFile,
      "hasUserAccessToLanguage(DefaultLangtag):",
      hasUserAccessToLanguage(DefaultLangtag));

    if ((isSingleFile && hasUserAccessToLanguage(DefaultLangtag)) || (!isSingleFile && hasUserAccessToLanguage(langtag))) {
      const progressBar = (uploadProgress) ?  <ProgressBar progress={uploadProgress} /> : null;
      return (
        <Dropzone onDrop={this.onDrop} className="dropzone" multiple={false}>
          {progressBar}
          <FileIcon internalFileName={internalFileName}></FileIcon>
          <span className="replace-note">{t('replace_existing_file')}</span>
        </Dropzone>
      );
    }
    else {
      return (
        <div className="no-permission-upload-file">
          <FileIcon internalFileName={internalFileName}></FileIcon>
        </div>);
    }
  }
}

module.exports = FileChangeUpload;