var Collection = require('ampersand-rest-collection');
var apiUrl = require('../apiUrl');
var Table = require('./Table');

var Tables = Collection.extend({
  model : Table,
  url : function () {
    return apiUrl('/tables');
  },
  parse: function(response) {
    return response.tables;
  }
});

module.exports = Tables;
