var Collection = require('ampersand-rest-collection');
var _ = require('lodash');
var apiUrl = require('../helpers/apiUrl');
var Row = require('./Row');

var INITIAL_LIMIT = 30;

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

  url : function () {
    return apiUrl('/tables/' + this.parent.getId() + '/rows');
  },

  parse : function (resp) {
    return resp.rows;
  },

  fetchInitial : function (options) {
    options.data = _.assign(options.data, {limit : INITIAL_LIMIT});
    this.fetch(options);
  },

  fetchTail : function (options) {
    //dont merge, or models are broken when duplicating while fetching the tail
    options = _.assign(options, {merge : false, add : true, remove : false});
    options.data = _.assign(options.data, {offset : INITIAL_LIMIT});
    this.fetch(options);
  }

});

module.exports = Rows;
