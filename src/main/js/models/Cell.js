var App = require('ampersand-app');
var AmpersandModel = require('ampersand-model');
var Dispatcher = require('../dispatcher/Dispatcher');
var Tables = require('./Tables');
var Column = require('./Column');
var RowConcatHelper = require('../helpers/RowConcatHelper');
var _ = require('lodash');

//FIXME: Handle Concat synch more elegant the Ampersand way
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
    rowId : 'number',
    row : 'object',
    changedHandler : 'array'
  },

  derived : {
    id : {
      deps : ['tableId', 'column', 'rowId'],
      fn : function () {
        return 'cell-' + this.tableId + '-' + this.column.getId() + '-' + this.rowId;
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
    isIdentifier : {
      deps : ['column'],
      fn : function () {
        return this.column.identifier;
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
    this.initConcatEvents();
  },

  initConcatEvents : function () {
    var self = this;

    var changedCellListener = function (changedCell) {
      //find the index value of the concat obj to update
      var concatIndexToUpdate = _.findIndex(self.column.concats, function (column) {
        return column.id === changedCell.column.id;
      });
      this.value[concatIndexToUpdate] = changedCell.value;
    };

    //debugger;
    //This cell is a concat cell and listens to its identifier cells
    if (this.isConcatCell) {
      this.column.concats.forEach(function (columnObj) {

        var changedEvent = 'changed-cell:' + self.tableId + ':' + columnObj.id + ':' + self.rowId;
        var handler = changedCellListener.bind(self);

        Dispatcher.on(changedEvent, handler);

        if (!self.changedHandler) {
          self.changedHandler = [];
        }
        self.changedHandler.push({
          name : changedEvent,
          handler : handler
        }); //save reference

      });
    }
  },

  //Delete all cell attrs and event listeners
  cleanupCell : function () {
    // We need to remove multiple dependant changed id cell events
    if (this.isConcatCell) {
      if (this.changedHandler && this.changedHandler.length > 0) {
        this.changedHandler.forEach(function (event) {
          //removes all callbacks
          Dispatcher.off(event.name, event.handler);
        });
      }
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

});

module.exports = Cell;
