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

      var newFile = new File(attrs);

      newFile.save();

      newFile.once('sync', function (a, b) {
        console.log('File saved', a, b);
        self.add(a, {merge : true});
      });
    });
  },

  comparator : "name"
});

module.exports = FilesCollection;
