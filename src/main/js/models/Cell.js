var App = require('ampersand-app');
var AmpersandModel = require('ampersand-model');
var Dispatcher = require('../dispatcher/Dispatcher');
var Tables = require('./Tables');
var Column = require('./Column');
var RowConcatHelper = require('../helpers/RowConcatHelper');
var _ = require('lodash');

//FIXME: Change to use fewer events and cleanup after table switches

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
    changedCellEvent : {
      deps : ['tableId', 'column', 'rowId'],
      fn : function () {
        return 'changed-cell:' + this.tableId + ':' + this.column.getId() + ':' + this.rowId;
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
    },

    isConcatCell : {
      deps : ['kind'],
      fn : function () {
        return this.kind === 'concat';
      }
    },

    rowConcatString : {
      deps : ['value'],
      cache : false,
      fn : function () {
        return function (langtag) {
          if (this.isConcatCell) {
            return RowConcatHelper.getRowConcatString(this.value, this.column, langtag);
          } else {
            //this cell is not of kind concat. so we return empty string.
            return "";
          }

        }
      }
    }

  },

  initialize : function (attrs, options) {
    var self = this;

    var changedCellListener = function (data) {
      //find the index value of the concat obj to update
      var concatIndexToUpdate = _.findIndex(this.column.concats, function (column) {
        return column.id === data.column.id;
      });
      this.value[concatIndexToUpdate] = data.value;
      //Signal react this cell has changed
      this.trigger("change");
      console.log("#### Synchronized the concat cell with data:", data.value, " ####");
    };

    var changeCellListener = function (event) {
      var self = this;
      var oldValue = this.value;
      if (oldValue !== event.newValue) {
        this.value = event.newValue;

        this.save(this, {
          parse : false,
          success : function () {
            console.log('changed cell trigger', self.changedCellEvent);
            Dispatcher.trigger(self.changedCellEvent, self);
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
    };
    if (options && options.row && !options.noListeners) {

      var name = this.changeCellEvent;
      var handler = changeCellListener.bind(this);
      App.on(name, handler);
      this.allEvents.push({name : name, handler : handler});
      options.row.on('remove', this.close.bind(this));

      //This cell is a concat cell and listens to its identifier cells
      if (this.isConcatCell) {
        this.column.concats.forEach(function (columnObj) {
          var changedEvent = 'changed-cell:' + self.tableId + ':' + columnObj.id + ':' + self.rowId;
          var handler = changedCellListener.bind(self);
          App.on(changedEvent, handler);
          self.allEvents.push({name : changedEvent, handler : handler});
        });
      }
    }

  },

  allEvents : [],

  close : function () {
    this.allEvents.forEach(function (eventStuff) {
      App.off(eventStuff.name, eventStuff.handler);
    });
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
