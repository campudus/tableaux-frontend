import Model from "ampersand-model";
import Columns from "./Columns";
import Rows from "./Rows";

const Table = Model.extend({
  props: {
    id: "number",
    name: "string",
    displayName: "object",
    description: "object",
    type: {
      type: "string",
      required: true,
      default: "generic",
      values: ["generic", "settings"],
      allowNull: false
    },
    group: {
      type: "object",
      required: false,
      default: () => {
        return {
          id: 0,
          displayName: {},
          description: {}
        };
      },
      allowNull: true
    }
  },

  collections: {
    columns: Columns,
    rows: Rows
  },

  initialize() {
  }

});

module.exports = Table;
