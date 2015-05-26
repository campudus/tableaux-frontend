var AmpersandModel = require('ampersand-model');
var apiUrl = require('../apiUrl');
var Cell = require('./Cell');

var Row = AmpersandModel.extend({
  props : {
    id : 'number'
  },

  session : {
    values : 'array'
  },

  derived : {
    cells : {
      deps : ['values'],
      fn : function () {
        var self = this;
        return this.values.map(function (value, idx) {
          var json = {
            tableId : self.collection.parent.getId(),
            colId : getColumnId(idx),
            rowId : self.getId(),
            value : value
          };
          var cell = new Cell(json, {row : self});
          return cell;
        });

        function getColumnId(idx) {
          return self.collection.parent.columns.at(idx).getId();
        }
      }
    }
  },

  url : function () {
    return apiUrl('/tables/' + this.collection.parent.getId() + '/row');
  }
});

module.exports = Row;
