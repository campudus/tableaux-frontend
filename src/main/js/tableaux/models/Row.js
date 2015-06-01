var AmpersandModel = require('ampersand-model');
var apiUrl = require('../apiUrl');
var Cell = require('./Cell');

var Row = AmpersandModel.extend({
  props : {
    id : 'number'
  },

  session : {
    columns : 'array',
    values : 'array'
  },

  derived : {
    cells : {
      deps : ['values'],
      fn : function () {
        var self = this;
        return this.values.map(function (value, idx) {
          var json = {
            tables : self.collection.parent.collection,
            tableId : self.collection.parent.getId(),
            column : getColumn(idx),
            rowId : self.getId(),
            value : value
          };
          var cell = new Cell(json, {row : self});
          return cell;
        });

        function getColumn(idx) {
          return self.collection.parent.columns.at(idx);
        }
      }
    }
  },

  serialize : function () {
    var ser = {columns : this.columns, rows : [{values : this.values}]};
    console.log('serializing row?', ser);
    return ser;
  },

  url : function () {
    return apiUrl('/tables/' + this.collection.parent.getId() + '/rows');
  }
});

module.exports = Row;
