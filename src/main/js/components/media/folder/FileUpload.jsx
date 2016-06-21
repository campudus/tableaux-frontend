var React = require('react');
var Dropzone = require('react-dropzone');
var request = require('superagent');
var apiUrl = require('../../../helpers/apiUrl');
var ActionCreator = require('../../../actions/ActionCreator');
var ProgressBar = require('../ProgressBar.jsx');
import {translate} from 'react-i18next';
import TableauxConstants from '../../../constants/TableauxConstants';

var FileUpload = React.createClass({

  propTypes : {
    folder : React.PropTypes.object.isRequired
  },

  getInitialState : function () {
    return {
      runningUploads : {}
    };
  },

  onDrop : function (files) {
    var self = this;
    //upload with default language
    var langtag = TableauxConstants.DefaultLangtag;

    files.forEach(function (file) {
      // upload each file for it's own

      var json = {title : {}, description : {}, folder : self.props.folder.id};
      json.title[langtag] = file.name;
      json.description[langtag] = "";

      request.post(apiUrl("/files"))
        .send(json)
        .end(function (err, res) {
          if (err) {
            console.error("Create file handle failed.", err);
            return;
          }

          var result = res.body;
          var uuid = result.uuid;

          var uploadUrl = apiUrl("/files/" + uuid + "/" + langtag);

          request.put(uploadUrl)
            .on('progress', function (e) {
              var runningUploads = self.state.runningUploads;
              runningUploads[uuid] = {
                progress : parseInt(e.percent),
                name : file.name
              };
              self.setState({
                runningUploads : runningUploads
              });
            })
            .attach("file", file, file.name)
            .end(function (err, res) {
              self.uploadCallback(err, res, uuid);
            });
        });
    });
  },

  uploadCallback : function (err, res, uuid) {
    var runningUploads = this.state.runningUploads;
    delete runningUploads[uuid];
    this.setState({
      runningUploads : runningUploads
    });

    if (err) {
      console.error("FileUpload.uploadCallback", err);
      return;
    }

    if (res) {
      var file = res.body;
      ActionCreator.addFile(file.uuid, file.title, file.description, file.externalName, file.internalName, file.mimeType, file.folder, file.url);
    }
  },

  render : function () {
    const {t} = this.props;
    var uploads = [];
    var runningUploads = this.state.runningUploads;
    for (var uploadUuid in runningUploads) {
      if (runningUploads.hasOwnProperty(uploadUuid))
        uploads.push(<div className="file-upload" key={uploadUuid}>
            <span>{runningUploads[uploadUuid].name}</span><ProgressBar progress={runningUploads[uploadUuid].progress}/>
          </div>
        );
    }

    var runningUploadsPanel = null;
    if (uploads.length > 0) {
      runningUploadsPanel = (
        <div className="running-uploads">
          <span className="uploads-text">{t('current_uploads')}:</span>
          {uploads}
        </div>
      );
    }

    return (
      <div className="file-uploads">
        {runningUploadsPanel}
        <Dropzone onDrop={this.onDrop} className="dropzone">
          <a>{t('upload_click_or_drop')}</a>
        </Dropzone>
      </div>
    );
  }
});

module.exports = translate(['media'])(FileUpload);