var AmpersandModel = require('ampersand-model');

var apiUrl = require('../../helpers/apiUrl');

var SimpleFolder = AmpersandModel.extend({
  props : {
    id : 'number',
    name : 'string',
    description : 'string',
    parent : {
      type : 'number',
      default : null,
      allowNull : true
    }
  }
});

module.exports = SimpleFolder;
