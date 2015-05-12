var $ = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;
var _ = require('underscore');
var TableauxConstants = require('./TableauxConstants');

var Cell = Backbone.Model.extend({
  initialize : function (model, options) {
    this.set('tableId', model.tableId);
    this.set('editing', this.get('editing') || false);
  },
  whitelist : ['tableId', 'colId', 'rowId', 'value'],
  url : function () {
    return apiUrl('/tables/' + this.get('tableId') + '/columns/' + this.get('colId') + '/rows/' + this.get('rowId'));
  },
  save : function (attrs, options) {
    options = options || {};

    var whitelisted = (this.whitelist) ?
      _.pick(this.attributes, this.whitelist) :
      this.attributes;

    whitelisted = {
      cells : [whitelisted]
    };

    options.data = JSON.stringify(whitelisted);
    return Backbone.Model.prototype.save.call(this, attrs, options);
  }
});

var Cells = Backbone.Collection.extend({
  model : Cell,
  initialize : function (models, options) {
    this.tableId = options.table.id;
    this.rowId = options.rowId;
    this.set(models);
  },
  url : function () {
    return this.rowId ?
      apiUrl('/tables/' + this.tableId + '/rows/' + this.rowId) :
      apiUrl('/tables/' + this.tableId + '/rows');
  }
});

var Row = Backbone.Model.extend({
  initialize : function (model, options) {
    var self = this;
    this.set('id', model.id);
    this.set('table', options.table);
    this.set('cells', new Cells(model.values.map(function (value, index) {
      return new Cell({
        tableId : self.get('table').get('id'),
        rowId : self.get('id'),
        colId : getColumnId(index),
        value : value
      });
    }), {table : self.get('table'), rowId : self.get('id')}));

    function getColumnId(index) {
      return self
        .get('table')
        .get('columns')
        .at(index)
        .get('id');
    }
  },
  parse : function (response) {
    var mappedCells = [];
    var values = (response.rows && response.rows[0] || response).values;
    for (var i = 0; i < values.length; i++) {
      mappedCells[i] = this.get('cells').at(i);
      mappedCells[i].set('value', values[i]);
    }
    return mappedCells;
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
    return response.rows.map(function (row) {
      return new Row(row, {table : self.table});
    });
  }
});

var Column = Backbone.Model.extend({
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
    return apiUrl('/tables/' + this.table.id + '/columns');
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
    var self = this;
    console.log('init table', this, model, options);
    this.set('id', this.get('id') || this.get('tableId') || model.id);
    this.set('name', this.get('name') || this.get('tableName') || model.name);
    this.set('columns', this.get('columns') || new Columns([], {table : this}));
    this.set('rows', this.get('rows') || new Rows([], {table : this}));
  },
  url : function () {
    return this.id ? apiUrl('/tables/' + this.id) : apiUrl('/tables');
  },
  parse : function (response) {
    return {
      id : response.tableId,
      name : response.tableName
    };
  }
});

var Tables = Backbone.Collection.extend({
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
  Table : Table,
  Tables : Tables,
  Column : Column,
  Columns : Columns,
  Row : Row,
  Rows : Rows,
  Cell : Cell,
  Cells : Cells
};
