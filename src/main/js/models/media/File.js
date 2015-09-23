var AmpersandModel = require('ampersand-model');

var apiUrl = require('../../helpers/apiUrl');

var File = AmpersandModel.extend({
  idAttribute : 'uuid',

  props : {
    uuid : 'string',
    name : 'string',
    description : 'string',
    mimeType : 'string',
    filename : 'string',
    folder : 'number',

    fileUrl : 'string'
  },

  url : function () {
    var base = this.urlRoot();

    return base + '/' + this.getId();
  },

  urlRoot : function () {
    return apiUrl('/files');
  },

  parse : function (attrs, option) {
    // because there is already a url function
    attrs.fileUrl = attrs.url;
    delete attrs.url;

    return attrs;
  }
});

module.exports = File;
