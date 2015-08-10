var React = require('react');
var apiUrl = require('../../apiUrl');
var Dropzone = require('react-dropzone');
var request = require('superagent');
var Dispatcher = require('../../Dispatcher');

var FileUpload = React.createClass({
  onDrop : function (files) {
    var self = this;
    var uploadUrl = apiUrl('/files');

    files.forEach(function (file) {
      // upload each file for it's own
      request.post(uploadUrl)
        .attach(file.name, file, file.name)
        .on('progress', function (e) {
          console.log('Percentage done:', file.name, e.percent);
        })
        .end(self.uploadCallback);
    });
  },

  uploadCallback : function (err, res) {
    if (err) {
      console.error("FileUpload.uploadCallback", err);
      return;
    }

    var folder = this.props.folder.id;

    if (res) {
      var result = res.body;
      result.folder = folder;
      result.fileUrl = result.url;
      delete result.url;

      Dispatcher.trigger('add-file', result);
    }
  },

  render : function () {
    return (
      <Dropzone onDrop={this.onDrop} className="dropzone">
        <a>Drop or click to upload.</a>
      </Dropzone>
    );
  }
});

module.exports = FileUpload;