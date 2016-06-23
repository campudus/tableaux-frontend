var AmpersandModel = require('ampersand-model');
var Dispatcher = require('../dispatcher/Dispatcher');
var Tables = require('./Tables');
var Column = require('./Column');
var TableauxConstants = require('./../constants/TableauxConstants');
const {ColumnKinds} = TableauxConstants;
var RowConcatHelper = require('../helpers/RowConcatHelper');
var _ = require('lodash');
import apiUrl from '../helpers/apiUrl';

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
        return this.kind === ColumnKinds.concat;
      }
    },

    linkString : {
      deps : ['linkStringLanguages'],
      fn : function () {
        return function (linkIndexAt, langtag) {
          var linkElemValue = this.linkStringLanguages[linkIndexAt];
          if (linkElemValue) {
            return linkElemValue[langtag] || "";
          } else {
            return null;
          }
        }
      }
    },

    linkStringLanguages : {
      deps : ['value'],
      fn : function () {
        if (!this.isLink) {
          return null;
        }
        var linksWithLangtags = [];
        var linkValues = this.value;
        var linkToColumn = this.column.toColumn;
        _.forEach(linkValues, function (linkElement) {
          var linkWithLangtag = {};
          _.forEach(TableauxConstants.Langtags, (langtag, idx)=> {
            linkWithLangtag[langtag] = RowConcatHelper.getRowConcatStringWithFallback(linkElement.value, linkToColumn, langtag);
          });
          linksWithLangtags.push(linkWithLangtag);
        });

        return linksWithLangtags;
      }
    },
    rowConcatLanguages : {
      deps : ['value'],
      fn : function () {
        if (!this.isConcatCell) {
          return null;
        }
        var rowConcatAllLangs = {};
        var self = this;
        _.forEach(TableauxConstants.Langtags, function (langtag, idx) {
          rowConcatAllLangs[langtag] = RowConcatHelper.getRowConcatString(self.value, self.column, langtag);
        });
        return rowConcatAllLangs;
      }
    },
    rowConcatString : {
      deps : ['rowConcatLanguages'],
      fn : function () {
        return function (langtag) {
          return this.rowConcatLanguages[langtag] || "";
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
      //we update the value with a new object to force derived attributes to be refreshed
      var tmpValue = _.cloneDeep(this.value);
      tmpValue[concatIndexToUpdate] = changedCell.value;
      this.value = tmpValue;
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
    return apiUrl('/tables/' + this.tableId + '/columns/' + this.column.getId() + '/rows/' + this.rowId);
  },

  serialize : function (options) {
    if (this.isLink) {
      var serializedObj = {};
      var linkValues = this.value.map(function (to) {
        return to.id;
      });
      serializedObj.value = {
        values : linkValues
      };
      return serializedObj;
    } else {
      return AmpersandModel.prototype.serialize.call(this);
    }
  },

});

module.exports = Cell;
