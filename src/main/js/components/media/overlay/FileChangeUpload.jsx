var React = require('react');
var Dropzone = require('react-dropzone');
var request = require('superagent');

var apiUrl = require('../../../helpers/apiUrl');
var ActionCreator = require('../../../actions/ActionCreator');

var FileChangeUpload = React.createClass({

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    internalFileName : React.PropTypes.string,
    uuid : React.PropTypes.string.isRequired
  },

  onDrop : function (files) {
    var self = this;
    var langtag = this.props.langtag;

    files.forEach(function (file) {
      // upload each file for it's own

      var uuid = self.props.uuid;

      var uploadUrl = apiUrl("/files/" + uuid + "/" + langtag);

      request.put(uploadUrl)
        .attach("file", file, file.name)
        .end(self.uploadCallback);
    });
  },

  uploadCallback : function (err, res) {
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
    var fileExtension = this.props.internalFileName ? this.props.internalFileName.split('.').pop() : false;
    var fileImg;
    if (fileExtension) {
      fileImg = <img src={"/img/filetypes/" + fileExtension +"-icon-128x128.png"} alt={fileExtension}/>;
    } else {
      fileImg = <span className="fa-stack empty-icon">
                  <i className="fa fa-file-o fa-stack-2x"></i>
                  <i className="fa fa-plus fa-stack-1x"></i>
                </span>;
    }

    return (
      <Dropzone onDrop={this.onDrop} className="dropzone" multiple={false}>
        {fileImg}
        <span>Um Datei auszutauschen hier klicken oder Datei hierher ziehen</span>
      </Dropzone>
    );
  }
});

module.exports = FileChangeUpload;