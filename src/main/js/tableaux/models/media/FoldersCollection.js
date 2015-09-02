var AmpersandCollection = require('ampersand-collection');
var apiUrl = require('../../apiUrl');
var SimpleFolder = require('./SimpleFolder');

var FoldersCollection = AmpersandCollection.extend({
  model : SimpleFolder
});

module.exports = FoldersCollection;
