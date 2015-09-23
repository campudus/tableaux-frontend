var AmpersandModel = require('ampersand-model');

var Dispatcher = require('../dispatcher/Dispatcher');
var apiUrl = require('../helpers/apiUrl');

var Tables = require('./Tables');
var Column = require('./Column');

var Cell = AmpersandModel.extend({
  props : {
    value : 'any'
  },

  session : {
    tables : [Tables, true],
    tableId : 'number',
    column : Column,
    rowId : 'number'
  },

  derived : {
    changeCellEvent : {
      deps : ['tableId', 'column', 'rowId'],
      fn : function () {
        return 'change-cell:' + this.tableId + ':' + this.column.getId() + ':' + this.rowId;
      }
    },
    isLink : {
      deps : ['column'],
      fn : function () {
        return this.column.isLink;
      }
    },
    isMultiLanguage : {
      deps : ['column'],
      fn : function () {
        return this.column.multilanguage;
      }
    },
    kind : {
      deps : ['column'],
      fn : function () {
        return this.column.kind;
      }
    }
  },

  initialize : function (attrs, options) {
    var event = this.changeCellEvent;
    var self = this;

    if (options && options.row && !options.noListeners) {
      // Cell could be initialized multiple times, so go and fuck off!
      Dispatcher.off(event);

      Dispatcher.on(event, this.changeCell.bind(this));

      options.row.on('remove', function () {
        // Remove changeCell listener
        Dispatcher.off(event);
      });
    }
  },

  changeCell : function (event) {
    var self = this;
    var oldValue = this.value;

    if (oldValue !== event.newValue) {
      this.value = event.newValue;

      this.save(this, {
        parse : false,
        success : function () {
          if (event.fetch) {
            self.fetch();
          }
        },
        error : function () {
          console.error('save unsuccessful!', arguments);

          if (event.fetch) {
            self.fetch();
          } else {
            self.value = oldValue;
          }
        }
      });
    }
  },

  url : function () {
    return apiUrl('/tables/' + this.tableId + '/columns/' + this.column.getId() + '/rows/' + this.rowId);
  },

  toJSON : function () {
    var attrs = this.serialize();
    if (this.isLink) {
      var values = attrs.value.map(function (to) {
        return to.id;
      });
      delete attrs.value;
      attrs.value = {
        values : values
      };
    }
    return attrs;
  },

  parse : function (resp, options) {
    if (!(options && options.parse)) {
      return this;
    } else if (resp.rows) {
      return resp.rows[0];
    } else {
      return resp;
    }
  }
});

module.exports = Cell;
