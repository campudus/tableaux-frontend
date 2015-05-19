var Model = require('ampersand-model');
var Columns = require('./Columns');
var Rows = require('./Rows');

var Table = Model.extend({
  props : {
    id : 'number',
    name : 'string'
  },
  derived : {
    columns : {
      deps : ['id'],
      fn : function () {
        console.log('deriving columns', this, this.getId());
        return new Columns([], {parent : this});
      }
    },
    rows : {
      deps : ['id'],
      fn : function () {
        console.log('deriving rows', this, this.getId());
        return new Rows([], {parent : this});
      }
    }
  }
});

module.exports = Table;
