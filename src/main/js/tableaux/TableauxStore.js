var $ = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;
var TableauxConstants = require('./TableauxConstants');

var Table = Backbone.Model.extend({
  defaults : {
    id : 0,
    name : '',
    columns : [],
    rows : []
  }
});

var Tables = Backbone.Collection.extend({
  model : Table
});

var Column = Backbone.Model.extend({
  defaults : {
    tableId : 0,
    columnId : 0,
    kind : 'string'
  }
});

var Columns = Backbone.Collection.extend({
  model : Column
});

var Row = Backbone.Model.extend({
  defaults : {
    tableId : 0,
    rowId : 0,
    cells : []
  }
});

var Rows = Backbone.Collection.extend({
  model : Row
});

var Cell = Backbone.Model.extend({
  defaults : {
    tableId : 0,
    columnId : 0,
    rowId : 0,
    value : ''
  }
});

var Cells = Backbone.Collection.extend({
  model : Cell
});

var TableauxStore = Backbone.Collection.extend({
  model : Table,
  url : apiUrl('/tables'),
  //sync : function(method, model, options) {
  //  console.log('trying to sync something', method, model, options);
  //  //options.beforeSend = function (xhr) {
  //  //  xhr.setRequestHeader('Content-Type', 'application/json');
  //  //};
  //  options.method = 'GET';
  //  return Backbone.sync(method, model, options);
  //},
  parse : function (response) {
    console.log('huh?', response);
  }
});

function apiUrl(path) {
  return '/api' + path;
}

module.exports = TableauxStore;