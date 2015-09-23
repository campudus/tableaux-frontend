var Collection = require('ampersand-rest-collection');

var apiUrl = require('../helpers/apiUrl');

var Column = require('./Column');

var Columns = Collection.extend({
  model : Column,
  url : function () {
    return apiUrl('/tables/' + this.parent.getId() + '/columns');
  },
  parse : function (resp) {
    return resp.columns;
  }
});

module.exports = Columns;
