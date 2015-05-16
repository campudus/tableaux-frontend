var $ = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;
var _ = require('underscore');
var TableauxConstants = require('./TableauxConstants');

var Cell = Backbone.Model.extend({
  initialize : function (model, options) {
    console.log('init cell', this, model, options);
    this.set('editing', this.get('editing') || false);
    this.set('tableId', options.table.get('id'));
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
  },
  parse : function (response) {
    console.log('parsing cell', response);
    return response;
  }
});

var Cells = Backbone.Collection.extend({
  model : Cell,
  initialize : function (models, options) {
    var self = this;
    console.log('init cells', this, models, options);
    this.table = options.table;
    this.rowId = options.rowId;
    if (options.table.get('columns').length > 0) {
      console.log('found columns and cells', models);
      this.set(models.map(function (value, index) {
        if (value instanceof Cell) {
          return value;
        } else {
          return new Cell({
            colId : getColumnId(index),
            value : value
          }, options);
        }
      }));
    } else {
      console.log('no columns in cells', models);
    }

    function getColumnId(index) {
      console.log('getColumnId of', index, self.table.get('columns'));
      return self.table.get('columns').at(index).get('id');
    }
  },
  url : function () {
    return this.rowId ?
      apiUrl('/tables/' + this.table.get('id') + '/rows/' + this.rowId) :
      apiUrl('/tables/' + this.table.get('id') + '/rows');
  },
  parse : function (response) {
    console.log('parsing cells', response);
    var self = this;
    if (this.table && this.table.get('columns').length > 0) {
      response = response.map(function (value, index) {
        if (!value.tableId) {
          return new Cell({
            colId : getColumnId(index),
            value : value
          }, options);
        } else {
          return value;
        }
      });
    }
    return response;

    function getColumnId(index) {
      console.log('getColumnId of cells', index, self.table.get('columns'));
      return self.table.get('columns').at(index).get('id');
    }
  }
});

var Row = Backbone.Model.extend({
  initialize : function (model, options) {
    var self = this;
    console.log('init row', this, model, options);
    this.set('id', model.id);
    if (options.table) {
      this.set('table', options.table);
      console.log('following models', model);
      if (model instanceof Cells) {
        this.set('values', model);
      } else {
        this.set('values', new Cells(model.values.map(function (cell, index) {
          return new Cell({
            tableId : options.table.id,
            rowId : model.id,
            colId : getColumnId(index),
            value : cell
          }, {table : options.table});
        }), {table : options.table, rowId : model.id}));
      }
    }

    function getColumnId(index) {
      console.log('getColumnId of cells', index, options.table.get('columns'));
      return options.table.get('columns').at(index).get('id');
    }
  },
  url : function () {
    return this.get('id') ?
      apiUrl('/tables/' + this.get('table').get('id') + '/rows/' + this.get('id')) :
      apiUrl('/tables/' + this.get('table').get('id') + '/rows');
  },
  parse : function (response) {
    console.log('parsing row', response);
    if (response.rows) {
      return mapFirstInRows();
    } else {
      return mapSingleRow();
    }

    function mapSingleRow() {
      return response;
    }

    function mapFirstInRows() {
      return response.rows[0];
    }

    //var mappedCells = [];
    //var values = (response.rows && response.rows[0] || response).values;
    //for (var i = 0; i < values.length; i++) {
    //  mappedCells[i] = this.get('values').at(i);
    //  mappedCells[i].set('value', values[i]);
    //}
    //return mappedCells;
  }
});

var Rows = Backbone.Collection.extend({
  model : Row,
  initialize : function (models, options) {
    options || (options = {});
    this.table = options.table;
    console.log('init rows', this);
    this.set(models.map(function (row) {
      console.log('row looks like', row);
      if (row instanceof Row) {
        return row;
      } else {
        return new Row(row, {table : options.table});
      }
    }));
  },
  url : function () {
    return apiUrl('/tables/' + this.table.get('id') + '/rows');
  },
  parse : function (response) {
    var self = this;
    console.log('parse Rows', response);
    response = response.rows.map(function (row) {
      console.log('row =', row);
      return new Row(row, {table : self.table});
    });
    return response.rows;
  }
});

var Column = Backbone.Model.extend({
  initialize : function (model, options) {
    this.set('kind', model.kind || 'text');
    this.set('name', model.name);
    console.log('init column', this, model, options);
  },
  url : function () {
    return this.get('id') ?
      apiUrl(this.table.url() + '/columns/' + this.id) :
      apiUrl(this.table.url() + '/columns');
  }
});

var Columns = Backbone.Collection.extend({
  model : Column,
  initialize : function (models, options) {
    console.log('init columns', this, models, options);
    this.table = options.table;
    this.set(models.map(function (col) {
      if (col instanceof Column) {
        return col;
      } else {
        return new Column(col, {table : options.table});
      }
    }));
  },
  url : function () {
    return apiUrl('/tables/' + this.table.get('id') + '/columns');
  },
  parse : function (response) {
    var self = this;
    response = response.columns.map(function (col) {
      return new Column(col, {table : self.table});
    });
    return response.columns;
  }
});

var Table = Backbone.Model.extend({
  initialize : function (model, options) {
    var self = this;
    console.log('init table', this, model, options);
    this.set('id', this.get('id') || model.id);
    this.set('name', this.get('name') || model.name);
    if (!model.columns) {
      console.log('no columns found!');
      this.set('columns', new Columns([], {table : this}));
      this.set('rows', new Rows([], {table : this}));
    } else {
      console.log('columns found!');
      this.set('columns', new Columns(model.columns, {table : this}));
      this.set('rows', new Rows(model.rows.map(function (row) {
        console.log('mapping row', row);
        return new Row(row, {table : self});
      }), {table : this}));
    }
  },
  url : function () {
    return this.get('id') ? apiUrl('/tables/' + this.get('id')) : apiUrl('/tables');
  },
  parse : function (response) {
    var self = this;
    console.log('parsing Table', response);
    if (response.columns && response.columns.length > 0) {
      response.columns = new Columns(response.columns, {table : this});
    }
    if (response.rows && response.rows.length > 0) {
      response.rows = new Rows(response.rows.map(function (row) {
        console.log('mapping a row', row);
        return new Row(row, {table : self});
      }), {table : this});
    }
    return response;
  }
});

Table.create = function (data) {
  var table = new Table({name : data.name});
  table.save({
    success : function (s) {
      console.log('table saved!', s);
      data.success(table);
    },
    error : function (err) {
      console.log('error saving new table', err);
      data.error(table);
    }
  });
  return table;
};

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

function init(done) {
  var tables = new Tables();
  tables.fetch({
    success : function () {
      console.log('done loading!');
      done(null, tables);
    },
    error : function (err) {
      console.log('error fetching tables');
      done(err);
    }
  })
}

module.exports = {
  init : init,
  Table : Table,
  Tables : Tables,
  Column : Column,
  Columns : Columns,
  Row : Row,
  Rows : Rows,
  Cell : Cell,
  Cells : Cells
};
