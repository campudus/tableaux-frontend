var AmpersandCollection = require('ampersand-collection');
var Dispatcher = require('../../dispatcher/Dispatcher');
var ActionTypes = require('../../constants/TableauxConstants').ActionTypes;

var SimpleFolder = require('./SimpleFolder');

var FoldersCollection = AmpersandCollection.extend({
  model : SimpleFolder,

  initialize : function () {
    Dispatcher.on(ActionTypes.ADD_FOLDER, this.addFolderHandler, this);
    Dispatcher.on(ActionTypes.CHANGE_FOLDER, this.changeFolderHandler, this);
    Dispatcher.on(ActionTypes.REMOVE_FOLDER, this.removeFolderHandler, this);
  },

  desctructor : function () {
    Dispatcher.off(ActionTypes.ADD_FOLDER, this.addFolderHandler, this);
    Dispatcher.off(ActionTypes.CHANGE_FOLDER, this.changeFolderHandler, this);
    Dispatcher.off(ActionTypes.REMOVE_FOLDER, this.removeFolderHandler, this);
  },

  addFolderHandler : function (payload) {
    console.log("Add new folder.", payload);
    var self = this;

    var newFolder = new SimpleFolder({
      name : payload.name,
      description : payload.description,
      parent : payload.parentId
    });
    newFolder.save(null, {
      error(error){
        console.warn("error creating folder: ", error);
        payload.onError(error);
      }
    });

    newFolder.once('sync', function (a, b) {
      console.log('Folder saved', a, b);
      self.add(a, {merge : true});
    });
  },

  changeFolderHandler : function (payload) {
    console.log("Change folder.", payload);
    var self = this;
    var folder = this.get(payload.folderId);
    folder.save({
      name : payload.name,
      description : payload.description,
      parent : payload.parentId
    }, {
      error(error) {
        console.warn("error changing folder: ", error);
        folder.fetch({method : "GET"});
        payload.onError(error);
      }
    });
    folder.once('sync', function (a, b) {
      console.log('Folder saved', a, b);
      self.add(a, {merge : true});
    });
  },

  removeFolderHandler : function (payload) {
    var folder = this.get(payload.folderId);

    folder.destroy({
      success : function () {
        console.log('Folder was deleted.');
      },
      error : function () {
        console.log('There was an error deleting the folder.');
      }
    });
  },

  comparator : "name"

});

module.exports = FoldersCollection;
