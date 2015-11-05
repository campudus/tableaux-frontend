var App = require('ampersand-app');
var AmpersandModel = require('ampersand-model');

var Tables = require('./Tables');
var Column = require('./Column');

var Cell = AmpersandModel.extend({
  modelType : 'Cell',

  props : {
    value : 'any'
  },

  session : {
    tables : {
      type : 'object',
      required : true
    },
    tableId : 'number',
    column : 'object',
    rowId : 'number'
  },

  derived : {
    id : {
      deps : ['tableId', 'column', 'rowId'],
      fn : function () {
        return 'cell-' + this.tableId + '-' + this.column.getId() + '-' + this.rowId;
      }
    },
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
    App.registerModel(this);

    var event = this.changeCellEvent;

    if (options && options.row && !options.noListeners) {
      // Cell could be initialized multiple times, so go and fuck off!
      App.off(event);
      App.on(event, this.changeCell.bind(this));

      options.row.on('remove', function () {
        // Remove changeCell listener
        App.off(event);
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
    return App.apiUrl('/tables/' + this.tableId + '/columns/' + this.column.getId() + '/rows/' + this.rowId);
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
