var Collection = require('ampersand-rest-collection');
var apiUrl = require('../apiUrl');
var Row = require('./Row');

var Rows = Collection.extend({
  model : Row,
  url : function() {
    return apiUrl('/tables/' + this.parent.getId() + '/rows');
  },
  parse: function(resp) {
    return resp.rows;
  }
});

module.exports = Rows;
