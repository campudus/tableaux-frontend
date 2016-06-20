var React = require('react');
var Dropzone = require('react-dropzone');
var request = require('superagent');
var XhrPoolMixin = require('../../mixins/XhrPoolMixin');
var apiUrl = require('../../../helpers/apiUrl');
var ActionCreator = require('../../../actions/ActionCreator');
var ProgressBar = require('../ProgressBar.jsx');
import FileIcon from '../folder/FileIcon.jsx';
import {hasUserAccessToLanguage} from '../../../helpers/accessManagementHelper';
import {DefaultLangtag} from '../../../constants/TableauxConstants';
import {translate} from 'react-i18next';


var FileChangeUpload = React.createClass({

  mixins : [XhrPoolMixin],

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    internalFileName : React.PropTypes.string,
    uuid : React.PropTypes.string.isRequired,
    isSingleFile : React.PropTypes.bool
  },

  getInitialState : function () {
    return {
      uploadProgress : null
    }
  },

  onDrop : function (files) {
    var self = this;
    var langtag = this.props.langtag;

    files.forEach(function (file) {
      // upload each file for it's own

      var uuid = self.props.uuid;

      var uploadUrl = apiUrl("/files/" + uuid + "/" + langtag);
      self.setState({
        uploadProgress : 0
      });
      var req = request.put(uploadUrl)
        .on('progress', function (e) {
          self.setState({
            uploadProgress : parseInt(e.percent)
          });
        })
        .attach("file", file, file.name)
        .end(self.uploadCallback);

      self.addAbortableXhrRequest(req.xhr);
    });
  },

  uploadCallback : function (err, res) {
    this.setState({
      uploadProgress : null
    });

    if (err) {
      console.error("FileUpload.uploadCallback", err);
      return;
    }

    if (res) {
      var file = res.body;
      ActionCreator.changedFileData(file.uuid, file.title, file.description, file.externalName, file.internalName, file.mimeType, file.folder, file.url);
    }
  },

  render : function () {
    const {langtag, internalFileName, isSingleFile} = this.props;
    const {uploadProgress} = this.state;
    const {t} = this.props;

    console.log("DefaultLangtag:", DefaultLangtag, "isSingleFile: ", isSingleFile, "hasUserAccessToLanguage(DefaultLangtag):", hasUserAccessToLanguage(DefaultLangtag));

    if ((isSingleFile && hasUserAccessToLanguage(DefaultLangtag)) || (!isSingleFile && hasUserAccessToLanguage(langtag))) {
      var progressBar = null;
      if (uploadProgress) {
        progressBar = <ProgressBar progress={uploadProgress}/>;
      }
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
});

module.exports = translate(['media'])(FileChangeUpload);