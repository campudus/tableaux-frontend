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

module.exports = SimpleFolder;
