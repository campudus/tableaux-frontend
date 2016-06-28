var _ = require('lodash');
var Moment = require('moment');
var App = require('ampersand-app');
import TableauxConstants from '../constants/TableauxConstants';
const {ColumnKinds} = TableauxConstants;

var NOVALUE = "– NO VALUE –";

var internal = {
  stringHasValue : function (stringToCheck) {
    return (stringToCheck && stringToCheck.toString().trim() !== "");
  },

  addDefaultLangtagPostfix : function (string) {
    return string.concat(" (" + TableauxConstants.DefaultLangtag + ")");
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

    if (concatColumn.kind !== ColumnKinds.concat) {
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

        case ColumnKinds.shorttext:
          appendString(getCellValueFromLanguage(concatElem));
          break;

        case ColumnKinds.text:
          appendString(getCellValueFromLanguage(concatElem));
          break;

        case ColumnKinds.link:
          var toColumn = concatElementColumn.toColumn;
          _.forEach(concatElem, function (linkElem, linkIndex) {

            //Check the column kind linked to
            switch (toColumn.kind) {
              case ColumnKinds.shorttext:
              case ColumnKinds.text:
                appendString(getCellValueFromLanguage(linkElem.value, toColumn));
                break;

              case ColumnKinds.concat:
                //console.warn("Todo: link is kind concat:", linkElem);
                //TODO: Recursive: when Concat column has a link as identifier which also links to another concat column
                break;

              default:
                console.error("undefined kind of linked column. kind:", toColumn.kind, "toColumn:", toColumn);
            }

          });

          break;

        case ColumnKinds.boolean:
          var boolValue = (concatElem ? concatElementColumn.displayName[langtag] : "");
          appendString(boolValue);
          break;

        case ColumnKinds.numeric:
          appendString(getCellValueFromLanguage(concatElem));
          break;

        case ColumnKinds.datetime:
          var dateTimeValue = getCellValueFromLanguage(concatElem);
          if (!_.isEmpty(dateTimeValue)) {
            var formattedDateTimeValue = Moment(dateTimeValue, TableauxConstants.DateTimeFormats.formatForServer).format(TableauxConstants.DateTimeFormats.formatForUser);
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
    var defaultLangtag = TableauxConstants.DefaultLangtag;
    var rowConcatString;

    if (toColumn.kind === ColumnKinds.concat) {
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

