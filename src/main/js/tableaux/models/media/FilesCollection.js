var AmpersandCollection = require('ampersand-collection');
var apiUrl = require('../../apiUrl');
var File = require('./File');
var Dispatcher = require('../../Dispatcher');

var FilesCollection = AmpersandCollection.extend({
  model : File,

  initialize : function () {
    var self = this;

    Dispatcher.on('add-file', function (attrs) {
      console.log("Add new file.", attrs);

      var newFile = new File(attrs);

      newFile.save();

      newFile.once('sync', function (a, b) {
        console.log('File saved', a, b);
        self.add(a, {merge : true});
      });
    });
  }
});

module.exports = FilesCollection;
