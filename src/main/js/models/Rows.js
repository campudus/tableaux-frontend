const Collection = require("ampersand-rest-collection");
const _ = require("lodash");
import apiUrl from "../helpers/apiUrl";
const Row = require("./Row");
import * as f from "lodash/fp";
import Request from "superagent";
import {Promise} from "es6-promise";       // explicitly import the polyfill for IE to recognise Promise.all
const throat = require("throat")(Promise); // throat ignores the global Promise polyfill, so pass it

export const INITIAL_PAGE_SIZE = 30;
export const PAGE_SIZE = 500;
export const MAX_CONCURRENT_PAGES = 2;

const Rows = Collection.extend({

  totalSize: INITIAL_PAGE_SIZE,

  model: function (attrs, options) {
    const tableId = options.collection.parent.getId();
    const columns = options.collection.parent.columns;
    const json = {
      id: f.get("id", attrs),
      tableId: tableId,
      values: f.get("values", attrs),
      annotations: f.get("annotations", attrs) || [],
      final: !!(f.get("final", attrs)),
      columns: columns
    };

    return new Row(json, {...options, parse: true});
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
    return (this.totalSize > 0)
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
        limit: INITIAL_PAGE_SIZE
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

    const success = options.success;

    const addRows = (n, data) => {
      this.set(data.rows, {remove: false, merge: false, add: true});
      console.log("Page", n, "loaded");
    };

    const fetchPage = (n) => new Promise(
      (resolve, reject) => {
        const pageLimits = this.calculatePage(n);
        Request
          .get(this.url())
          .query(pageLimits)
          .end(
            (err, response) => {
              if (err) {
                reject(err);
              } else {
                addRows(n, JSON.parse(response.text));
                resolve();
              }
            }
          );
      }
    );

    const fetchTail = (ignore, response) => {
      this.totalSize = f.get(["page", "totalSize"], response) || 0;
      const pages = this.pageCount();
      console.log("Table has", pages, "total pages");
      console.log("Page 1 loaded");
      if (pages > 1) {
        const pageNums = f.range(2, pages + 1);
        Promise.all(
          pageNums.map(throat(MAX_CONCURRENT_PAGES, fetchPage))
        ).then(success);
      } else {
        success();
      }
    };

    this.fetch({...options, success: fetchTail});
  }
});

export default Rows;
