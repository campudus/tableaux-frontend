var AmpersandModel = require('ampersand-model');

var apiUrl = require('../helpers/apiUrl');

var Column = AmpersandModel.extend({
  props : {
    id : 'number',
    name : 'string',
    kind : 'string',
    ordering : 'number',
    multilanguage : {
      type : 'boolean',
      default : false
    }
  },

  session : {
    toTable : {
      type : 'number'
    },
    toColumn : {
      type : 'object'
    }
  },

  derived : {
    isLink : {
      deps : ['kind'],
      fn : function () {
        return this.kind === 'link';
      }
    }
  },

  url : function () {
    var base = this.urlRoot();
    if (this.isNew()) {
      return base;
    } else {
      return base + '/' + this.getId();
    }
  },

  urlRoot : function () {
    return apiUrl('/tables/' + this.collection.parent.getId() + '/columns');
  }
});

module.exports = Column;
