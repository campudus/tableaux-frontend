var React = require('react');
var apiUrl = require('../../apiUrl');
var Dropzone = require('react-dropzone');
var request = require('superagent');
var Dispatcher = require('../../Dispatcher');

var FileUpload = React.createClass({
  onDrop : function (files) {
    console.log('Received files: ', files);

    var uploadUrl = apiUrl('/files');

    var req = request.post(uploadUrl);
    files.forEach(function (file) {
      //name, file, name for multipart request
      req.attach(file.name, file, file.name);
    });
    req.end(this.uploadCallback);
  },

  uploadCallback : function (err, res) {
    if (err) {
      console.log(err);
      return;
    }

    var folder = this.props.folder.id;

    if (res) {
      var result = JSON.parse(res.text);

      Dispatcher.trigger('add-file', {
        'uuid' : result.uuid,
        'name' : result.name,
        'description' : result.name,
        'folder' : folder
      });
    }
  },

  render : function () {
    return (
      <div>
        <Dropzone onDrop={this.onDrop} width={100} height={40}>
          <div>Drop or click to upload.</div>
        </Dropzone>
      </div>
    );
  }
});

module.exports = FileUpload;