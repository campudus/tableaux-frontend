var AmpersandModel = require('ampersand-model');
var apiUrl = require('../apiUrl');

var Column = AmpersandModel.extend({
  props : {
    id : 'number',
    name : 'string',
    kind : 'string',
    ordering : 'number'
  },

  urlRoot : function() {
    console.log('get url from column', this);
    return apiUrl('/tables/' + this.collection.parent.getId() + '/columns');
  }
});

module.exports = Column;
