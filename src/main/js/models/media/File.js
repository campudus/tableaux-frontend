var AmpersandModel = require('ampersand-model');

var apiUrl = require('../../helpers/apiUrl');

var File = AmpersandModel.extend({
  idAttribute : 'uuid',

  props : {
    uuid : 'string',
    title : 'object',
    description : 'object',
    mimeType : 'object',
    externalName : 'object',
    internalName : 'object',
    folder : 'number',
    createdAt: 'string',
    updatedAt: 'string',

    fileUrl : 'object'
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
