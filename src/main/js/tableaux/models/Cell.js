var AmpersandModel = require('ampersand-model');
var Dispatcher = require('../Dispatcher');
var Tables = require('./Tables');
var Column = require('./Column');
var sync = require('ampersand-sync');
var apiUrl = require('../apiUrl');

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
    self.changeCellListener = this.changeCell.bind(this);

    if (options && options.row && !options.noListeners) {
      Dispatcher.on(event, self.changeCellListener);

      options.row.on('remove', function () {
        console.log('removing cell listener');
        Dispatcher.off(event, self.changeCellListener);
      });
    }
  },

  changeCell : function (event) {
    console.log('got a change cell event for cell(' + this.column.getId() + ',' + this.rowId + '):', event);
    var self = this;
    var oldValue = this.value;

    if (oldValue !== event.newValue) {
      this.value = event.newValue;

      this.save(this, {
        parse : false,
        success : function () {
          console.log('saved successfully');
          oldValue = null;
          if (event.fetch) {
            self.fetch();
          }
        },
        error : function () {
          console.log('save unsuccessful!');
          self.value = oldValue;
        }
      });
    }
  },

  url : function () {
    var url = apiUrl('/tables/' + this.tableId + '/columns/' + this.column.getId() + '/rows/' + this.rowId);
    return url;
  },

  toJSON : function () {
    var attrs = this.serialize();
    if (this.isLink) {
      var values = attrs.value.map(function (to) {
        return to.id;
      });
      delete attrs.value;
      attrs.value = {
        from : this.rowId,
        values : values
      };
    }
    return attrs;
  },

  parse : function (resp, options) {
    console.log('parsing cell', resp, options);
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
