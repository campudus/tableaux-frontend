var Collection = require("ampersand-rest-collection");

import apiUrl from "../helpers/apiUrl";
import * as f from "lodash/fp";
import {ColumnKinds} from "../constants/TableauxConstants";

var Column = require("./Column");

var Columns = Collection.extend({
  model: Column,
  url: function () {
    return apiUrl("/tables/" + this.parent.getId() + "/columns");
  },
  parse: function (resp) {
    const cols = resp.columns;
    const groupMemberIds = f.compose(
      f.map("id"),
      f.flatten,
      f.map("groups"),
      f.filter(f.matchesProperty("kind", ColumnKinds.group))
    )(cols);
    return cols.map(
      col => f.assoc("isGroupMember", f.contains(col.id, groupMemberIds), col)
    );
  }
});

module.exports = Columns;
