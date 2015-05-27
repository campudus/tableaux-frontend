var Collection = require('ampersand-rest-collection');
var apiUrl = require('../apiUrl');
var Row = require('./Row');

var Rows = Collection.extend({
  model : Row,
  url : function() {
    console.log('parent of row?', this.parent.getId());
    return apiUrl('/tables/' + this.parent.getId() + '/rows');
  },
  parse: function(resp) {
    return resp.rows;
  },
  serialize : function(attrs) {
    console.log('serializing rows?', attrs);
  }
});

module.exports = Rows;
