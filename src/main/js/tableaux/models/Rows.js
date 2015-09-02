var Collection = require('ampersand-rest-collection');
var _ = require('lodash');
var apiUrl = require('../apiUrl');
var Row = require('./Row');

var Rows = Collection.extend({
  model : Row,

  currentPage : {
    offset : 0,
    limit : 20
  },

  url : function () {
    return apiUrl('/tables/' + this.parent.getId() + '/rows');
  },

  parse : function (resp) {
    return resp.rows;
  },

  fetchPage : function (options) {
    // Defaults so the requested collections stays unchanged
    options = options || {remove : false, merge : false, add : true};
    options.data = options.data || this.currentPage;

    this.fetch(options);

    this.currentPage.offset += options.data.limit;
  }
});

module.exports = Rows;
