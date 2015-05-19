var AmpersandModel = require('ampersand-model');
var apiUrl = require('../apiUrl');

var Column = AmpersandModel.extend({
  props : {
    name : 'string',
    kind : 'string',
    ordering : 'number'
  },

  urlRoot : function() {
    console.log('get url from column', this);
    return apiUrl('/tables/' + this.collection.parent.id + '/columns');
  }
});

module.exports = Column;
