var React = require('react');
var App = require('ampersand-app');
var Dropzone = require('react-dropzone');
var request = require('superagent');

var apiUrl = require('../../helpers/apiUrl');
var Dispatcher = require('../../dispatcher/Dispatcher');

var FileUpload = React.createClass({

  propTypes : {
    langtag : React.PropTypes.string.isRequired
  },

  onDrop : function (files) {
    var self = this;

    var langtag = App.langtags[0];

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
            .attach("file", file, file.name)
            .end(self.uploadCallback);
        });
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