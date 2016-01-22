var React = require('react');
var Dropzone = require('react-dropzone');
var request = require('superagent');

var apiUrl = require('../../helpers/apiUrl');
var Dispatcher = require('../../dispatcher/Dispatcher');

var FileChangeUpload = React.createClass({

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    internalFileName : React.PropTypes.string.isRequired,
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
      var result = res.body;
      result.fileUrl = result.url;
      delete result.url;

      Dispatcher.trigger('changed-file-data', result);
    }
  },

  render : function () {
    var fileExtension = this.props.internalFileName.split('.').pop();
    return (
      <Dropzone onDrop={this.onDrop} className="dropzone" multiple={false}>
        <img src={"/img/filetypes/" + fileExtension +"-icon-128x128.png"} alt={fileExtension}/>
        <span>Um Datei auszutauschen hier klicken oder Datei hierher ziehen</span>
      </Dropzone>
    );
  }
});

module.exports = FileChangeUpload;