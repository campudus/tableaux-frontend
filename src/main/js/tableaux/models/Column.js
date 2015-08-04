var AmpersandModel = require('ampersand-model');
var apiUrl = require('../apiUrl');

var Column = AmpersandModel.extend({
  props : {
    id : 'number',
    name : 'string',
    kind : 'string',
    ordering : 'number',
    multilanguage : ['boolean', true, false]
  },

  session : {
    toTable : ['number', false],
    toColumn : [Column, false],
    isLink : ['boolean', true, false]
  },

  initialize : function(attrs, options) {
    if (attrs.toTable && attrs.toColumn) {
      this.isLink = true;
    }
  },

  urlRoot : function() {
    console.log('get url from column', this);
    return apiUrl('/tables/' + this.collection.parent.getId() + '/columns');
  }
});

module.exports = Column;
