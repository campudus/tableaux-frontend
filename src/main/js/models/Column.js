var AmpersandModel = require("ampersand-model");
import apiUrl from "../helpers/apiUrl";
import TableauxConstants from "../constants/TableauxConstants";
const {ColumnKinds} = TableauxConstants;

var Column = AmpersandModel.extend({
  props: {
    id: "number",
    name: "string",
    kind: "string",
    ordering: "number",
    multilanguage: {
      type: "boolean",
      default: false
    },
    identifier: "boolean",
    concats: {
      type: "object",
      default: null
    },
    displayName: {
      type: "object",
      default: null
    },
    description: {
      type: "object",
      default: null
    },
    languageType: {
      type: "string",
      default: null
    },
    countryCodes: {
      type: "array",
      default: null
    }
  },

  session: {
    toTable: {
      type: "number"
    },
    toColumn: {
      type: "object"
    },
    visible: {
      type: "boolean"
    }
  },

  derived: {
    isLink: {
      deps: ["kind"],
      fn: function () {
        return this.kind === ColumnKinds.link;
      }
    }
  },

  url: function () {
    var base = this.urlRoot();
    if (this.isNew()) {
      return base;
    } else {
      return base + "/" + this.getId();
    }
  },

  urlRoot: function () {
    return apiUrl("/tables/" + this.collection.parent.getId() + "/columns");
  }
});

module.exports = Column;
