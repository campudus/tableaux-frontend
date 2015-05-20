var AmpersandModel = require('ampersand-model');
var apiUrl = require('../apiUrl');
var Cell = require('./Cell');

var Row = AmpersandModel.extend({
  props : {
    id : 'number',
    values : 'array'
  },
  derived : {
    cells : {
      deps : ['values'],
      fn : function() {
        var self = this;
        return this.values.map(function(value, idx) {
          console.log('cell from row', value);
          var json = {
            tableId : self.collection.parent.getId(),
            colId : getColumnId(idx),
            rowId : self.getId(),
            value : value
          };
          return new Cell(json);
        });

        function getColumnId(idx) {
          return self.collection.parent.columns.at(idx).getId();
        }
      }
    }
  },

  url : function() {
    return apiUrl('/tables/' + this.collection.parent.getId() + '/row');
  }
});

module.exports = Row;
