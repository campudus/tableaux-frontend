var AmpersandModel = require('ampersand-model');

var apiUrl = require('../../helpers/apiUrl');

var FoldersCollection = require('./FoldersCollection');
var FilesCollection = require('./FilesCollection');

var Folder = AmpersandModel.extend({
  props : {
    id : {
      type : 'number',
      default : null
    },
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

    if (this.isNew() || isNaN(this.getId())) {
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
