var AmpersandCollection = require('ampersand-collection');

var apiUrl = require('../../helpers/apiUrl');
var Dispatcher = require('../../dispatcher/Dispatcher');

var File = require('./File');

var FilesCollection = AmpersandCollection.extend({
  model : File,

  initialize : function () {
    var self = this;

    Dispatcher.on('add-file', function (attrs) {
      console.log("Add new file.", attrs);

      if (attrs.uuid === "undefined") {
        throw "file must already exist"
      }

      var newFile = new File(attrs);
      console.log('File added to collection', newFile);
      self.add(newFile, {merge : true});
    });

    Dispatcher.on('change-file', function (attrs) {
      console.log("Change file.", attrs);

      if (attrs.uuid === "undefined") {
        throw "file must already exist"
      }

      var file = new File(attrs);
      file.save();
      file.once('sync', function (a, b) {
        console.log('File saved', a, b);
        self.add(a, {merge : true});
      });
    });
  },

  comparator : "name"
});

module.exports = FilesCollection;
