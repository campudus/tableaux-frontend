var React = require('react');
var apiUrl = require('../../apiUrl');
var Dropzone = require('react-dropzone');
var _ = require('lodash');
var request = require('superagent');
var Dispatcher = require('../../Dispatcher');
var FileEdit = require('./FileEdit.jsx');

var FileUpload = React.createClass({
  onDrop : function (files) {
    console.log('Received files: ', files);

    var self = this;
    var uploadUrl = apiUrl('/files');

    files.forEach(function (file) {
      // upload each file for it's own
      var req = request.post(uploadUrl);
      req.attach(file.name, file, file.name);
      req.end(self.uploadCallback);
    });
  },

  uploadCallback : function (err, res) {
    if (err) {
      console.error("FileUpload.uploadCallback", err);
      return;
    }

    var folder = this.props.folder.id;

    if (res) {
      var result = JSON.parse(res.text);
      result.folder = folder;
      result.fileUrl = result.url;
      delete result.url;

      Dispatcher.trigger('new-edit-file', result);
    }
  },

  getInitialState : function () {
    return {
      fileEdit : null
    }
  },

  componentWillMount : function () {
    var self = this;
    Dispatcher.on('add-edit-file', function (collection) {
      console.log('add-edit-file', collection);

      self.setState({
        fileEdit : collection
      });
    })
  },

  render : function () {
    var fileEdit = null;

    if (this.state.fileEdit !== null && this.state.fileEdit.isCollection) {
      fileEdit = this.state.fileEdit.map(function (file, idx) {
        console.log('get fileedit render', file.uuid);
        return <FileEdit key={file.uuid} file={file} idx={idx}/>
      });
    }

    return (
      <div>
        {fileEdit}
        <Dropzone onDrop={this.onDrop} className="dropzone">
          <a>Drop or click to upload.</a>
        </Dropzone>
      </div>
    );
  }
});

module.exports = FileUpload;