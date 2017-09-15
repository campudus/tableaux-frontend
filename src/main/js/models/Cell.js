const AmpersandModel = require("ampersand-model");
const TableauxConstants = require("./../constants/TableauxConstants");
const {ColumnKinds} = TableauxConstants;
import * as f from "lodash/fp";
import apiUrl from "../helpers/apiUrl";
import getDisplayValue from "./getDisplayValue";
import ActionCreator from "../actions/ActionCreator.js";
import {clearCallbacks, listenForCellChange} from "../dispatcher/GlobalCellChangeListener";

const Cell = AmpersandModel.extend({
  modelType: "Cell",

  props: {
    value: "any"
  },

  session: {
    tables: {
      type: "object",
      required: true
    },
    tableId: "number",
    column: "object",
    rowId: "number",
    row: "object",
    changedHandler: "array",
    annotations: "object"
  },

  derived: {
    id: {
      deps: ["tableId", "column", "rowId"],
      fn: function () {
        return "cell-" + this.tableId + "-" + (this.column && this.column.getId()) + "-" + this.rowId;
      }
    },

    isLink: {
      deps: ["column"],
      fn: function () {
        return f.get(["column", "isLink"], this);
      }
    },

    isMultiLanguage: {
      deps: ["column"],
      fn: function () {
        return f.get(["column", "multilanguage"], this);
      }
    },

    isIdentifier: {
      deps: ["column"],
      fn: function () {
        return f.get(["column", "identifier"], this);
      }
    },

    isMultiCountry: {
      deps: ["column"],
      fn: function () {
        return f.matchesProperty(["column", "languageType"], "country", this);
      }
    },

    kind: {
      deps: ["column"],
      fn: function () {
        return (this.column && this.column.kind) || "uninitialized";
      }
    },

    isConcatCell: {
      deps: ["kind"],
      fn: function () {
        return f.matchesProperty("kind", ColumnKinds.concat, this);
      }
    },

    isEditable: {
      deps: ["tables", "tableId", "column"],
      fn: function () {
        const column = this.column;
        const table = this.tables.get(this.tableId);

        // if it's the cell
        // - is of the first or second column of a table with type 'settings'
        // the cell is not editable.
        return !(table.type === "settings" && (column.id === 1 || column.id === 2));
      }
    },

    linkIds: {
      deps: ["value"],
      fn: function () {
        return (f.get("isLink", this))
          ? f.reduce(f.merge, {}, (this.value || []).map(
            (link, idx) => ({
              [link.id]: idx
            })
          ))
          : null;
      }
    },

    __updateDisplayValue: {
      deps: ["value"],
      fn: function () {
        if (f.isNil(this)) {
          return "";
        }
        if (this.kind === ColumnKinds.link) { // re-register listeners for needed dependencies
          const self = this;
          if (this.__displayValue) {
            clearCallbacks(self.id);
          }
          this.initLinkEvents.call(self, self);
        }
        const dv = getDisplayValue(this.column, this.value);
        this.__displayValue = dv;
        return dv;
      }
    },

    displayValue: {
      deps: ["value"],
      fn: function () {
        return f.get("__displayValue", this) || this.__updateDisplayValue;
      }
    }
  },

  initialize: function (attrs, options) {
    if (f.contains(f.get(["column", "kind"], attrs), [ColumnKinds.concat, ColumnKinds.group])) {
      this.initConcatEvents(attrs);
    } else if (f.get("isLink", this)) {
      this.initLinkEvents(attrs);
    }
  },

  initConcatEvents: function (attrs) {
    const concats = (attrs.column.kind === ColumnKinds.concat) ? attrs.column.concats : attrs.column.groups;
    const calcId = ({id}) => `cell-${attrs.tableId}-${id}-${attrs.row.id}`;

    this.concatIds = f.reduce(f.merge, {}, concats.map((c, idx) => ({[calcId(c)]: idx})));
    const handleDataChange = function ({cell}) {
      if (!cell.id || !f.contains(cell.id, f.keys(this.concatIds))) {
        return;
      }
      const newValue = f.assoc(
        f.get(cell.id, this.concatIds),
        cell.value,
        this.value
      );
      if (!f.equals(newValue, this.value)) {
        this.value = newValue;
        ActionCreator.broadcastDataChange({
          cell: this,
          row: this.row
        });
      }
    };

    f.keys(this.concatIds).forEach(
      key => listenForCellChange(this.id, key, handleDataChange.bind(this))
    );
  },

  initLinkEvents: function (attrs) {
    const handleDataChange = function ({row, cell}) {
      const newValue = f.assoc([this.linkIds[row.id.toString()], "value"], cell.value, this.value);
      if (!f.equals(newValue, this.value)) {
        this.value = newValue;
        const self = this;
        ActionCreator.broadcastDataChange({
          cell: self,
          row: self.row
        });
      }
    };

    this.value.forEach(
      ({id}) => {
        listenForCellChange(this.id, `cell-${this.column.toTable}-${this.column.toColumn.id}-${id}`, handleDataChange.bind(this));
      }
    );
  },

  // Delete all cell attrs and event listeners
  cleanupCell: function () {
  },

  url: function () {
    return apiUrl("/tables/" + this.tableId + "/columns/" + this.column.getId() + "/rows/" + this.rowId);
  },

  serialize: function (options) {
    if (this.isLink) {
      const serializedObj = {};
      const linkValues = this.value.map(function (to) {
        return to.id;
      });
      serializedObj.value = {
        values: linkValues
      };
      return serializedObj;
    } else {
      return AmpersandModel.prototype.serialize.call(this);
    }
  }

});

module.exports = Cell;
