var AmpersandModel = require('ampersand-model');
var apiUrl = require('../../apiUrl');

var SimpleFolder = AmpersandModel.extend({
  props : {
    id : 'number',
    name : 'string',
    description : 'string',
    parent : {
      type : SimpleFolder,
      default : null
    }
  }
});

module.exports = SimpleFolder;
