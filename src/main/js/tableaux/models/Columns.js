var Collection = require('ampersand-rest-collection');
var apiUrl = require('../apiUrl');
var Column = require('./Column');

var Columns = Collection.extend({
  model : Column,
  url : function() {
    console.log('parent of column?', this.parent.getId());
    return apiUrl('/tables/' + this.parent.getId() + '/columns');
  },
  parse: function(resp) {
    return resp.columns;
  }
});

module.exports = Columns;
