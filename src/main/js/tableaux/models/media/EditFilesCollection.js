var AmpersandCollection = require('ampersand-collection');
var File = require('./File');
var Dispatcher = require('../../Dispatcher');

var EditFilesCollection = AmpersandCollection.extend({
  mainIndex: 'uuid',

  initialize : function () {
    var self = this;

    this.on('add', function (model, collection) {
      Dispatcher.trigger('add-edit-file', collection);
    });

    this.on('remove', function (model, collection) {
      Dispatcher.trigger('add-edit-file', collection);
    });

    Dispatcher.on('new-edit-file', function (editFile) {
      console.log("Edit file.", editFile);

      self.add(editFile, {merge : true});
    });

    Dispatcher.on('remove-edit-file', function (uuid) {
      console.log("Remove edit-file.", uuid);

      self.remove(uuid);
    });
  }
});


module.exports = EditFilesCollection;
