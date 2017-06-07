const AmpersandModel = require("ampersand-model");
const Dispatcher = require("../dispatcher/Dispatcher");
const TableauxConstants = require("./../constants/TableauxConstants");
const {ActionTypes, ColumnKinds} = TableauxConstants;
import * as f from "lodash/fp";
import apiUrl from "../helpers/apiUrl";
import getDisplayValue from "./getDisplayValue";
import ActionCreator from "../actions/ActionCreator.js";

// FIXME: Handle Concat synch more elegant the Ampersand way
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
        return "cell-" + this.tableId + "-" + this.column.getId() + "-" + this.rowId;
      }
    },

    changedCellEvent: {
      deps: ["tableId", "column", "rowId"],
      fn: function () {
        return "changed-cell:" + this.tableId + ":" + this.column.getId() + ":" + this.rowId;
      }
    },

    isLink: {
      deps: ["column"],
      fn: function () {
        return this.column.isLink;
      }
    },

    isMultiLanguage: {
      deps: ["column"],
      fn: function () {
        return this.column.multilanguage;
      }
    },

    isIdentifier: {
      deps: ["column"],
      fn: function () {
        return this.column.identifier;
      }
    },

    isMultiCountry: {
      deps: ["column"],
      fn: function () {
        return this.column.languageType === "country";
      }
    },

    kind: {
      deps: ["column"],
      fn: function () {
        return this.column.kind;
      }
    },

    isConcatCell: {
      deps: ["kind"],
      fn: function () {
        return this.kind === ColumnKinds.concat;
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
        return (this.isLink)
          ? f.reduce(f.merge, {}, (this.value || []).map(
            (link, idx) => ({
              [link.id]: idx
            })
          ))
          : null;
      }
    },

    displayValue: {
      deps: ["value", "column", "tables"],
      fn: function () {
        return getDisplayValue(this.column, this.value);
      }
    }
  },

  initialize: function (attrs, options) {
    if (f.contains(attrs.column.kind, [ColumnKinds.concat, ColumnKinds.group])) {
      this.initConcatEvents(attrs);
    } else if (this.isLink) {
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
        const self = this;
        ActionCreator.broadcastDataChange({
          cell: self,
          row: self.row,
          triggeredFrom: self
        });
      }
    };

    this.handleDataChange = handleDataChange.bind(this);
    Dispatcher.on(ActionTypes.BROADCAST_DATA_CHANGE, this.handleDataChange, this);
  },

  initLinkEvents: function (attrs) {
    const handleDataChange = function ({row, cell}) {
      if (row.tableId !== attrs.column.toTable || cell.column.id !== attrs.column.toColumn.id
        || !f.contains(row.id.toString(), f.keys(this.linkIds))
      ) {
        return;
      }

      const newValue = f.assoc([this.linkIds[row.id.toString()], "value"], cell.value, this.value);
      if (!f.equals(newValue, this.value)) {
        this.value = newValue;
        const self = this;
        ActionCreator.broadcastDataChange({
          cell: self,
          row: self.row,
          triggeredFrom: self
        });
      }
    };

    this.handleDataChange = handleDataChange.bind(this);
    Dispatcher.on(ActionTypes.BROADCAST_DATA_CHANGE, this.handleDataChange, this);
  },

  // Delete all cell attrs and event listeners
  cleanupCell: function () {
    if (this.handleDataChange) {
      Dispatcher.off(ActionTypes.BROADCAST_DATA_CHANGE, this.handleDataChange);
    }
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
