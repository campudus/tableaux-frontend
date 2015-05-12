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
    this.editing = this.get('editing') || false;
  },
  url : function () {
    return apiUrl('/tables/' + this.tableId + '/columns/' + this.colId + '/rows/' + this.rowId);
  }
});

var Cells = Backbone.Collection.extend({
  model : Cell,
  initialize : function (model, options) {
    this.tableId = options.table.id;
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
    this.table = this.get('table') || options.table;
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
  initialize : function (model, options) {
    console.log('init table ', this, model, options);
    this.id = this.get('id') || this.get('tableId') || model.id;
    this.name = this.get('name') || this.get('tableName') || model.name;
    this.columns = new Columns(this.get('columns') || [], {table : this});
    this.rows = new Rows(this.get('rows') || [], {table : this});
    console.log('initialized to', this);
  },
  url : function () {
    var url = this.id ?
      apiUrl('/tables/' + this.id) :
      apiUrl('/tables');
    console.log('url from table=', url, this);
    return url;
  },
  parse : function (response) {
    console.log('parsing table = ', response);
    this.id = response.id || response.tableId;
    this.name = response.name || response.tableName;
    this.columns = new Columns(response.columns || [], {table : this});
    this.rows = new Rows(response.rows || [], {table : this});
    return response;
  }
});

var Tables = Backbone.Collection.extend({
  model : Table,
  url : apiUrl('/tables'),
  parse : function (response) {
    console.log('parsing tables =', response);
    return response.tables;
  }
});

function apiUrl(path) {
  return '/api' + path;
}

module.exports = {
  Table : Table,
  Tables : Tables,
  Column : Column,
  Columns : Columns,
  Row : Row,
  Rows : Rows,
  Cell : Cell,
  Cells : Cells
};
