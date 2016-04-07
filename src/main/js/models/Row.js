var AmpersandModel = require('ampersand-model');
var apiUrl = require('../helpers/apiUrl');
var Columns = require('./Columns');
var Cell = require('./Cell');
var Cells = require('./Cells');
var _ = require('lodash');

var Row = AmpersandModel.extend({
  props : {
    id : 'number',
    values : 'array'
  },

  session : {
    tableId : 'number',
    columns : 'object',
    recentlyDuplicated : {
      type : 'boolean',
      default : false
    }
  },

  collections : {
    cells : Cells
  },

  duplicate : function (cb) {
    //We need to create a new row, or the current is getting changed
    let copiedRow = new Row(_.extend({}, this.attributes), {collection : this.collection, parent : this.parent});

    copiedRow.save(null, {
      url : this.url() + "/duplicate",
      method : 'POST',
      success : (row) => {
        console.log("success duplicating row. rowId:", this.id, " of tableId:", this.tableId, " data:", row);
        row.recentlyDuplicated = true;
        this.collection.add(row);
        cb(row);
      },
      error : () => {
        console.log("error duplicating row.");
      }

    });
  },

  parse : function (attrs, options) {
    if (attrs.values) {
      attrs.cells = attrs.values.map(function (value, idx) {
        return {
          index : idx,
          value : value,
          rowId : attrs.id
        };
      });
      return attrs;
    }

    //When adding a new row attrs has correct values
    else {
      return attrs;
    }
  },

  url : function () {
    var base = this.urlRoot();

    if (this.isNew()) {
      return base;
    } else {
      return base + '/' + this.getId();
    }
  },

  urlRoot : function () {
    // first try tableId because there could be a Row with out collection
    var tableId = this.tableId || this.collection.parent.getId();
    return apiUrl('/tables/' + tableId + '/rows');
  }
});

module.exports = Row;
