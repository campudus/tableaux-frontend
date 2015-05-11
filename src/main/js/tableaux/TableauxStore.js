var $ = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;
var TableauxConstants = require('./TableauxConstants');

var Cell = Backbone.Model.extend({
  initialize : function (model, options) {
    this.tableId = this.get('tableId');
    this.rowId = this.get('rowId');
    this.colId = this.get('colId');
    this.value = this.get('value');
  },
  url : function() {

  }
});

var Cells = Backbone.Collection.extend({
  model : Cell,
  initialize : function (model, options) {
    this.tableId = options.tableId;
    this.rowId = this.get('id');
    this.values = this.get('values');
  },
  url : function () {
    return this.id ?
      apiUrl('/tables/' + this.tableId + '/rows/' + this.id) :
      apiUrl('/tables/' + this.tableId + '/rows');
  }
});

var Row = Backbone.Model.extend({
  initialize : function (model, options) {
    var self = this;
    this.id = this.get('id');
    this.table = this.get('table');
    this.cells = this.get('values').map(function (value, index) {
      return new Cell({
        table : self.table,
        rowId : self.id,
        colId : getColumnId(index),
        value : value
      });
    });

    function getColumnId(index) {
      return self.table.columns.at(index).id;
    }
  }
});

var Rows = Backbone.Collection.extend({
  model : Row,
  initialize : function (models, options) {
    this.table = options.table;
  },
  url : function () {
    return apiUrl('/tables/' + this.table.id + '/rows');
  },
  parse : function (response) {
    var self = this;
    response = response.rows.map(function (row) {
      row.table = self.table;
      return row;
    });
    return response;
  }
});

var Column = Backbone.Model.extend({
  initialize : function (model, options) {
    this.id = this.get('id');
    this.name = this.get('name');
    this.table = this.get('table');
  },
  url : function () {
    return this.id ? apiUrl(this.table.url() + '/columns/' + this.id) : apiUrl(this.table.url() + '/rows');
  }
});

var Columns = Backbone.Collection.extend({
  model : Column,
  initialize : function (models, options) {
    this.table = options.table;
  },
  url : function () {
    return this.id ?
      apiUrl('/tables/' + this.table.id + '/columns/' + this.id) :
      apiUrl('/tables/' + this.table.id + '/columns');
  },
  parse : function (response) {
    var self = this;
    response = response.columns.map(function (col) {
      col.table = self.table;
      return col;
    });
    return response;
  }
});

var Table = Backbone.Model.extend({
  initialize : function () {
    this.id = this.get('id');
    this.name = this.get('name');
    this.columns = new Columns([], {table : this});
    this.rows = new Rows([], {table : this});
  },
  url : function () {
    return this.id ?
      apiUrl('/tables/' + this.id) :
      apiUrl('/tables');
  }
});

var TableauxStore = Backbone.Collection.extend({
  model : Table,
  url : apiUrl('/tables'),
  parse : function (response) {
    return response.tables;
  }
});

function apiUrl(path) {
  return '/api' + path;
}

module.exports = {
  store : TableauxStore,
  Table : Table,
  Column : Column,
  Columns : Columns,
  Row : Row,
  Rows : Rows,
  Cell : Cell,
  Cells : Cells
};
