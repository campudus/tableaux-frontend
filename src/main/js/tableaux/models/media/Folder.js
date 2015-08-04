var AmpersandModel = require('ampersand-model');
var apiUrl = require('../../apiUrl');
var FoldersCollection = require('./FoldersCollection');
var FilesCollection = require('./FilesCollection');

var Folder = AmpersandModel.extend({
  props : {
    id : 'number',
    name : 'string',
    description : 'string',
    parent : 'number'
  },

  collections : {
    subfolders : FoldersCollection,
    files : FilesCollection
  },

  url : function () {
    var base = this.urlRoot();

    if (this.isNew() || this.getId() === null) {
      return base;
    } else {
      return base + '/' + this.getId();
    }
  },

  urlRoot : function () {
    return apiUrl('/folders');
  }
});

module.exports = Folder;
