var Collection = require("ampersand-rest-collection");

import apiUrl from "../helpers/apiUrl";

var Column = require("./Column");

var Columns = Collection.extend({
  model: Column,
  url: function () {
    return apiUrl("/tables/" + this.parent.getId() + "/columns");
  },
  parse: function (resp) {
    return resp.columns;
  }
});

module.exports = Columns;
