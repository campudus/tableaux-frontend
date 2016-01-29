var App = require('ampersand-app');
var Moment = require('moment');
var AmpersandModel = require('ampersand-model');
var Dispatcher = require('../dispatcher/Dispatcher');
var _ = require('lodash');

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
            var thisTable = this.tables.get(this.tableId);
            var thisColumn = this.column;
            var concatString = this.getRowConcatString(thisTable, thisColumn, this.value, langtag);
            return concatString;
          } else {
            //this cell is not of kind concat. so we return empty string.
            return "";
          }

        }
      }
    }

  },

  getRowConcatString : function (passedTable, passedColumn, concatArray, langtag) {
    var concatStringArray = [];
    var self = this;

    var appendString = function (appendVal) {
      if (_.isFinite(appendVal)) {
        appendVal = String(appendVal);
      }
      if (_.isString(appendVal)) {
        var trimmed = appendVal.trim();
        if (trimmed !== "") {
          concatStringArray.push(trimmed);
        }
      } else if (appendVal !== null && appendVal !== undefined) {
        console.warn("Cell.getRowConcatString: No String was passed to appendString Method. Passed value is:", appendVal);
      }
    };

    //Returns the appropriate column object for the concat element
    var getColumnByConcatIndex = function (concatIndex) {
      var columnsOfThisTable = passedTable.columns;
      var identifierColumnId = passedColumn.concats[concatIndex];
      return columnsOfThisTable.get(identifierColumnId);
    };

    if (passedColumn.kind !== "concat") {
      console.error("getRowConcatString was passed no concat column:", passedColumn);
    }

    _.forEach(concatArray, function (concatElem, index) {

      //console.log("getRowConcatString concatElem:", concatElem);

      //This is the related column for a specific concat element
      var concatElementColumn = getColumnByConcatIndex(index);

      //Helper Function to get the value in the correct language. Works with single language and multilanguage objects
      //ExplicitColumn (optional) can be used for getting the value of a linked column. Default is this cells column
      var getCellValueFromLanguage = function (cellValue, explicitColumn) {
        if (explicitColumn === undefined) {
          explicitColumn = concatElementColumn;
        }
        if (explicitColumn.multilanguage) {
          return cellValue[langtag] || ""; // maps undefined to empty string
        } else {
          return cellValue || "";
        }
      };

      switch (concatElementColumn.kind) {

        case "shorttext":
          appendString(getCellValueFromLanguage(concatElem));
          break;

        case "text":
          appendString(getCellValueFromLanguage(concatElem));
          break;

        case "link":
          var toColumn = concatElementColumn.toColumn;
          _.forEach(concatElem, function (linkElem, linkIndex) {

            //Check the column kind linked to
            switch (toColumn.kind) {
              case "shorttext":
              case "text":
                appendString(getCellValueFromLanguage(linkElem.value, toColumn));
                break;

              case "concat":
                console.log("getRowConcatString link is kind concat:", linkElem);
                //Recursive: when Concat column has a link as identifier which also links to another concat column
                var linkedTable = self.tables.get(concatElementColumn.toTable);
                self.getRowConcatString(linkedTable, toColumn, linkElem.value, langtag);
                break;

              default:
                console.error("undefined kind of linked column. kind:", toColumn.kind, "toColumn:", toColumn);
            }

          });

          break;

        case "boolean":
          var boolValue = (concatElem ? concatElementColumn.name : "");
          appendString(boolValue);
          break;

        case "numeric":
          appendString(getCellValueFromLanguage(concatElem));
          break;

        case "datetime":
          var dateTimeValue = getCellValueFromLanguage(concatElem);
          if (!_.isEmpty(dateTimeValue)) {
            var formattedDateTimeValue = Moment(dateTimeValue, App.dateTimeFormats.formatForServer).format(App.dateTimeFormats.formatForUser);
            appendString(formattedDateTimeValue);
          }
          break;

        default:
          console.warn("undefined concatElement of kind:", concatElementColumn.kind, ":", concatElem);
      }
    });

    return concatStringArray.join(" ");

  },

  initialize : function (attrs, options) {
    var self = this;

    var changedCellListener = function (data) {
      //find the index value of the concat obj to update
      var concatIndexToUpdate = this.column.concats.indexOf(data.column.id);
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

      // Cell could be initialized multiple times
      if (this.allEvents.length > 0) {
        var allEvents = this.allEvents;
        //console.log("events:", this.events);
      }

      var name = this.changeCellEvent;
      var handler = changeCellListener.bind(this);
      App.on(name, handler);
      this.allEvents.push({name : name, handler : handler});
      options.row.on('remove', this.close.bind(this));

      //This cell is a concat cell and listens to its identifier cells
      if (this.isConcatCell) {
        this.column.concats.forEach(function (columnId) {
          var name = 'changed-cell:' + self.tableId + ':' + columnId + ':' + self.rowId;
          var handler = changedCellListener.bind(self);
          App.on(name, handler);
          self.allEvents.push({name : name, handler : handler});

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
