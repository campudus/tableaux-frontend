const Collection = require("ampersand-rest-collection");
const _ = require("lodash");
const apiUrl = require("../helpers/apiUrl");
const Row = require("./Row");
import {getSessionUnlockedElements} from "../helpers/annotationHelper";
import * as f from "lodash/fp";

export const INITIAL_PAGE_SIZE = 30;
export const PAGE_SIZE = 500;

const Rows = Collection.extend({

  totalSize: INITIAL_PAGE_SIZE,

  model: function (attrs, options) {
    const tableId = options.collection.parent.getId();
    const columns = options.collection.parent.columns;
    const sessionUnlocked = getSessionUnlockedElements({tableId});
    const json = {
      id: attrs.id,
      tableId: tableId,
      values: attrs.values,
      annotations: attrs.annotations || [],
      final: !!attrs.final && sessionUnlocked !== true && !f.contains(attrs.id, sessionUnlocked),
      columns: columns
    };

    return new Row(json, options);
  },

  isModel: function (model) {
    return model instanceof Row;
  },

  comparator: false,

  url: function () {
    return apiUrl("/tables/" + this.parent.getId() + "/rows");
  },

  parse: function (resp) {
    // set totalSize for calculating pagination
    this.totalSize = _.get(resp, ["page", "totalSize"], 0);

    // do real parsing
    return resp.rows;
  },

  pageCount: function () {
    return this.totalSize > 0
      ? 1 + _.ceil((this.totalSize - INITIAL_PAGE_SIZE) / PAGE_SIZE)
      : 0;
  },

  calculatePage: function (pageNumber) {
    const pageCount = this.pageCount();

    if (pageNumber <= 0 && pageNumber > pageCount) {
      throw new Error("invalid pageNumber, should be greater than 0 and smaller or equal to " + pageCount);
    }

    const totalSize = this.totalSize;

    if (pageNumber === 1) {
      return {
        offset: 0,
        limit: totalSize >= INITIAL_PAGE_SIZE
          ? INITIAL_PAGE_SIZE
          : totalSize % INITIAL_PAGE_SIZE
      };
    } else {
      return {
        offset: INITIAL_PAGE_SIZE + PAGE_SIZE * (pageNumber - 2),
        limit: pageNumber === pageCount
          ? (totalSize - INITIAL_PAGE_SIZE) % PAGE_SIZE || PAGE_SIZE
          : PAGE_SIZE
      };
    }
  },

  fetchPage(pageNumber, options) {
    const page = this.calculatePage(pageNumber);

    // don't merge, or models are broken when duplicating while fetching the tail
    options = _.assign(options, {merge: false, add: true, remove: false});
    options.data = _.assign({}, options.data, page);
    this.fetch(options);
  }
});

export default Rows;
