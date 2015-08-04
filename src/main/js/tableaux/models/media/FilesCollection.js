var AmpersandCollection = require('ampersand-collection');
var apiUrl = require('../../apiUrl');
var File = require('./File');
var Dispatcher = require('../../Dispatcher');

var FilesCollection = AmpersandCollection.extend({
  model : File,

  initialize : function () {
    var self = this;

    Dispatcher.on('add-file', function (attrs) {
      console.log(attrs);

      var newFile = new File({
        uuid : attrs.uuid,
        name : attrs.name,
        description : attrs.description,
        folder : attrs.folder
      });

      self.add(newFile);

      newFile.save({
        success : function () {
          console.log('added new file!');
        },
        error : function (err) {
          console.log('could not add new file!', err);
        }
      });
    });
  }
});

module.exports = FilesCollection;
