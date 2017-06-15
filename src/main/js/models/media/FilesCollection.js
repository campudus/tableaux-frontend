import AmpersandCollection from "ampersand-collection";
import Dispatcher from "../../dispatcher/Dispatcher";
import {ActionTypes} from "../../constants/TableauxConstants";
import File from "./File";

const FilesCollection = AmpersandCollection.extend({
  model: File,

  initialize: function () {
    Dispatcher.on(ActionTypes.ADD_FILE, this.mergeFileHandler, this);
    Dispatcher.on(ActionTypes.CHANGE_FILE, this.changeFileHandler, this);
    Dispatcher.on(ActionTypes.CHANGED_FILE_DATA, this.mergeFileHandler, this);
    Dispatcher.on(ActionTypes.REMOVE_FILE, this.removeFileHandler, this);
  },

  destructor: function () {
    Dispatcher.off(ActionTypes.ADD_FILE, this.mergeFileHandler, this);
    Dispatcher.off(ActionTypes.CHANGE_FILE, this.changeFileHandler, this);
    Dispatcher.off(ActionTypes.CHANGED_FILE_DATA, this.mergeFileHandler, this);
    Dispatcher.off(ActionTypes.REMOVE_FILE, this.removeFileHandler, this);
  },

  mergeFileHandler: function (payload) {
    if (payload.uuid === "undefined") {
      throw new Error("File's uuid can't be undefined. File must already exist.");
    }

    const file = new File({
      uuid: payload.uuid,
      title: payload.title,
      description: payload.description,
      externalName: payload.externalName,
      internalName: payload.internalName,
      mimeType: payload.mimeType,
      folder: payload.folderId,
      fileUrl: payload.fileUrl
    });

    this.add(file, {merge: true});
  },

  changeFileHandler: function (payload) {
    const self = this;

    if (payload.uuid === "undefined") {
      throw new Error("File's uuid can't be undefined. File must already exist.");
    }

    const file = this.get(payload.uuid);

    console.log("saving file:", file, " payload:", payload);

    file.save({
      title: payload.title,
      description: payload.description,
      externalName: payload.externalName,
      internalName: payload.internalName,
      mimeType: payload.mimeType,
      folder: payload.folderId,
      fileUrl: payload.fileUrl
    });
    file.once("sync", function (a, b) {
      console.log("File saved", a, b);
      self.add(a, {merge: true});
    });
  },

  removeFileHandler: function (payload) {
    const file = this.get(payload.fileId);

    file.destroy({
      success: function () {
        console.log("File was deleted.");
      },
      error: function () {
        console.log("There was an error deleting the file.");
      }
    });
  },

  comparator: "name"
});

module.exports = FilesCollection;
