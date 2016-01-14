var AmpersandCollection = require('ampersand-collection');
var Dispatcher = require('../../dispatcher/Dispatcher');

var apiUrl = require('../../helpers/apiUrl');

var SimpleFolder = require('./SimpleFolder');

var FoldersCollection = AmpersandCollection.extend({
  model : SimpleFolder,

  initialize : function () {
    var self = this;

    Dispatcher.on('add-folder', function (attrs) {
      console.log("Add new folder.", attrs);

      var newFolder = new SimpleFolder(attrs);
      newFolder.save();
      newFolder.once('sync', function (a, b) {
        console.log('Folder saved', a, b);
        self.add(a, {merge : true});
      });
    });

    Dispatcher.on('change-folder', function (attrs) {
      console.log("Change folder.", attrs);

      var folder = new SimpleFolder(attrs);
      folder.save();
      folder.once('sync', function (a, b) {
        console.log('Folder saved', a, b);
        self.add(a, {merge : true});
      });
    });
  }
});

module.exports = FoldersCollection;
