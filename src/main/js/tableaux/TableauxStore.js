var $ = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;
var TableauxConstants = require('./TableauxConstants');

var Row = Backbone.Model.extend({
  initialize : function (model, options) {
    console.log('init Row', model, options);
    this.table = options.table;
    this.id = this.get('id');
    this.values = this.get('values');
  },
  url : function () {
    return apiUrl(this.table.url() + '/rows/' + this.id);
  },
  defaults : {
    values : []
  }
});

var Cell = Backbone.Model.extend({
  initialize : function (model, options) {
    console.log('hello in cell', this);
    this.row = this.get('row');
    this.colIdx = this.get('colIdx');
    this.value = this.get('value');
  }
});

var Column = Backbone.Model.extend({
  initialize : function (model, options) {
    this.id = this.get('id');
    this.name = this.get('name');
  }
});

var Columns = Backbone.Collection.extend({
  initialize : function (models, options) {
    this.table = options.table;
  },
  url : function () {
    console.log('the column looks like this:', this);
    return this.table.url() + '/columns';
  },
  model : Column
});

var Table = Backbone.Model.extend({
  urlRoot : apiUrl('/tables'),
  idAttribute : 'id',
  initialize : function () {
    var self = this;
    console.log('id=', self.id);
    this.name = this.get('name');
    this.columns = this.get('columns');
    this.rows = this.get('rows');
    console.log('initialized this Table=', this);
  },
  defaults : {
    columns : [],
    rows : []
  }
});

var TableauxStore = Backbone.Collection.extend({
  model : Table,
  url : apiUrl('/tables'),
  parse : function (response) {
    console.log('parsing', response);
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
  Cell : Cell,
};
