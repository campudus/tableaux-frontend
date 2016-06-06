var _ = require('lodash');
var Moment = require('moment');
var App = require('ampersand-app');

var NOVALUE = "– NO VALUE –";

var internal = {
  stringHasValue : function (stringToCheck) {
    return (stringToCheck && stringToCheck.toString().trim() !== "");
  },

  addDefaultLangtagPostfix : function (string) {
    return string.concat(" (" + App.defaultLangtag + ")");
  }
};

var RowConcatHelper = {

  getRowConcatString : function (concatArray, concatColumn, langtag) {
    var concatStringArray = [];
    var finalString;

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
      return concatColumn.concats[concatIndex];
    };

    if (concatColumn.kind !== "concat") {
      console.error("getRowConcatString was passed no concat column:", concatColumn);
    }

    _.forEach(concatArray, function (concatElem, index) {
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
                //var linkedTable = passedCell.tables.get(concatElementColumn.toTable);
                //passedCell.getRowConcatString(linkedTable, toColumn, linkElem.value, langtag);
                break;

              default:
                console.error("undefined kind of linked column. kind:", toColumn.kind, "toColumn:", toColumn);
            }

          });

          break;

        case "boolean":
          var boolValue = (concatElem && concatElem.displayName ? concatElementColumn.displayName[langtag] : "");
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

    finalString = concatStringArray.join(" ");
    return finalString;

  },

  getRowConcatStringWithFallback : function (rowCellIdValue, toColumn, langtag) {
    var defaultLangtag = App.defaultLangtag;
    var rowConcatString;

    if (toColumn.kind === "concat") {
      rowConcatString = this.getRowConcatString(rowCellIdValue, toColumn, langtag);

      if (!internal.stringHasValue(rowConcatString)) {
        if (defaultLangtag !== langtag) {
          rowConcatString = this.getRowConcatString(rowCellIdValue, toColumn, defaultLangtag);

          if (internal.stringHasValue(rowConcatString)) {
            rowConcatString = internal.addDefaultLangtagPostfix(rowConcatString);
          }
        }
      }

      if (!internal.stringHasValue(rowConcatString)) {
        rowConcatString = NOVALUE;
      }
    }

    //Text, Shorttext, etc.
    else {

      if (toColumn.multilanguage) {
        rowConcatString = rowCellIdValue[langtag];

        //Link ID value is empty
        if (!internal.stringHasValue(rowConcatString)) {

          //Get default language fallback
          if (langtag != defaultLangtag) {
            rowConcatString = rowCellIdValue[defaultLangtag];

            //Default language fallback is not empty. Postfix the langtag
            if (internal.stringHasValue(rowConcatString)) {
              rowConcatString = internal.addDefaultLangtagPostfix(rowConcatString);
            }
          }

          //There's no fallback value
          if (!internal.stringHasValue(rowConcatString)) {
            rowConcatString = NOVALUE;
          }

        }
      } else {

        // Single language value
        rowConcatString = internal.stringHasValue(rowCellIdValue) ? rowCellIdValue : NOVALUE;
      }

    }

    return rowConcatString;

  }

};

module.exports = RowConcatHelper;

