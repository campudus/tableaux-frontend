const Collection = require('ampersand-rest-collection');
const _ = require('lodash');
const apiUrl = require('../helpers/apiUrl');
const Row = require('./Row');

const PAGE_SIZE = 500;

const Rows = Collection.extend({

  totalSize : 0,

  model : function (attrs, options) {
    const tableId = options.collection.parent.getId();
    const columns = options.collection.parent.columns;
    const json = {
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
    // set totalSize for calculating pagination
    this.totalSize = _.get(resp, ['page', 'totalSize'], 0);

    // do real parsing
    return resp.rows;
  },

  pageCount : function () {
    const totalSize = this.totalSize;
    return totalSize > 0 ? _.ceil(totalSize / PAGE_SIZE) : 0;
  },

  calculatePage : function (pageNumber) {
    const pageCount = this.pageCount();

    if (pageNumber < 0 && pageNumber > pageCount) {
      throw new Error('invalid pageNumber, should greater than -1 and smaller or equal to ', pageCount);
    }

    if (pageNumber === 0) {
      return {
        offset : 0,
        limit : 0
      }
    }

    const totalSize = this.totalSize;

    return {
      offset : PAGE_SIZE * (pageNumber - 1),
      limit : pageNumber === pageCount ? totalSize % PAGE_SIZE : PAGE_SIZE
    }
  },

  fetchPage(pageNumber, options) {
    const page = this.calculatePage(pageNumber);

    //dont merge, or models are broken when duplicating while fetching the tail
    options = _.assign(options, {merge : false, add : true, remove : false});
    options.data = _.assign({}, options.data, page);
    this.fetch(options);
  }
});

module.exports = Rows;
