var Collection = require('ampersand-rest-collection');
var _ = require('lodash');
var apiUrl = require('../helpers/apiUrl');
var Row = require('./Row');


var Rows = Collection.extend({

  model : function (attrs, options) {
    var tableId = options.collection.parent.getId();
    var columns = options.collection.parent.columns;
    var json = {
      id : attrs.id,
      tableId : tableId,
      values : attrs.values,
      columns : columns
    };

    return new Row(json, options);
  },

  isModel : function (model) {
    return model instanceof Row;
  },

  comparator : false,

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
