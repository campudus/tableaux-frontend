var AmpersandModel = require('ampersand-model');
var apiUrl = require('../helpers/apiUrl');
var Columns = require('./Columns');
var Cell = require('./Cell');
var Cells = require('./Cells');

var Row = AmpersandModel.extend({
  props : {
    id : 'number',
    values : 'array'
  },

  session : {
    tableId : 'number',
    columns : 'object'
  },

  collections : {
    cells : Cells
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
