import * as _ from "lodash";
import Moment from "moment";

const TableauxConstants = require("../constants/TableauxConstants");
const ColumnKinds = TableauxConstants.ColumnKinds;

const NOVALUE = "– NO VALUE –";

var internal = {
  stringHasValue: (stringToCheck) => {
    return (stringToCheck && stringToCheck.toString().trim() !== "");
  },

  // can be called with optional defaultLangtag to get fallback value
  getRowConcatString: (concatValueArray, concatColumn, langtag, defaultLangtag) => {
    if (concatColumn.kind !== ColumnKinds.concat) {
      console.error("getRowConcatString was passed no concat column:", concatColumn);
    }

    const concatColumnArray = concatColumn.concats;
    let concatStringArray = [];

    /**
     * Appends value to concatStringArray
     * Expects numbers or strings!
     */
    const appendString = (appendVal) => {
      if (_.isFinite(appendVal)) {
        appendVal = String(appendVal);
      }

      if (_.isString(appendVal)) {
        var trimmed = appendVal.trim();
        if (trimmed !== "") {
          concatStringArray.push(trimmed);
        }
      }
    };

    /**
     * Helper Function to get the value in the correct language.
     * Works with single language and multilanguage objects.
     * Maps undefined to empty string.
     */
    const getCellValueFromLanguage = (cellValue, column) => {
      if (column.multilanguage) {
        let value = (typeof cellValue[langtag] !== "undefined") ? cellValue[langtag] : ((typeof defaultLangtag !== "undefined") ? cellValue[defaultLangtag] : "");
        return (value === null || value === undefined) ? "" : value;
      } else {
        return (cellValue === null || cellValue === undefined) ? "" : cellValue;
      }
    };

    _.forEach(concatValueArray, (concatValue, index) => {
      // This is the related column for a specific concat element
      const concatColumn = concatColumnArray[index];

      switch (concatColumn.kind) {

        case ColumnKinds.shorttext:
          appendString(getCellValueFromLanguage(concatValue, concatColumn));
          break;

        case ColumnKinds.text:
          appendString(getCellValueFromLanguage(concatValue, concatColumn));
          break;

        case ColumnKinds.link:
          let toColumn = concatColumn.toColumn;

          _.forEach(concatValue, (linkElem, linkIndex) => {
            // Check the column kind linked to
            switch (toColumn.kind) {
              case ColumnKinds.shorttext:
              case ColumnKinds.text:
                appendString(getCellValueFromLanguage(linkElem.value, toColumn));
                break;

              case ColumnKinds.concat:
                // Concat column has a link as identifier which also links to another concat column
                appendString(internal.getRowConcatString(linkElem.value, toColumn, langtag, defaultLangtag));
                break;

              default:
                console.error("undefined kind of linked column. kind:", toColumn.kind, "toColumn:", toColumn);
            }
          });

          break;

        case ColumnKinds.boolean:
          const boolValue = (concatValue ? concatColumn.displayName[langtag] : "");
          appendString(boolValue);
          break;

        case ColumnKinds.numeric:
          appendString(getCellValueFromLanguage(concatValue, concatColumn));
          break;

        case ColumnKinds.datetime:
          const dateTimeValue = getCellValueFromLanguage(concatValue, concatColumn);
          if (!_.isEmpty(dateTimeValue)) {
            const formattedDateTimeValue = Moment(dateTimeValue, TableauxConstants.DateTimeFormats.formatForServer).format(TableauxConstants.DateTimeFormats.formatForUser);
            appendString(formattedDateTimeValue);
          }
          break;

        case ColumnKinds.date:
          const dateValue = getCellValueFromLanguage(concatValue, concatColumn);
          if (!_.isEmpty(dateValue)) {
            const moment = Moment(dateValue, TableauxConstants.DateFormats.formatForServer);
            const formattedDateValue = moment.isValid()
              ? moment.format(TableauxConstants.DateFormats.formatForUser)
              : "";
            appendString(formattedDateValue);
          } else {
            appendString("");
          }
          break;

        case ColumnKinds.currency: break; // suppress warnings

        default:
          console.warn("undefined concatElement of kind:", concatColumn.kind, ":", concatValue);
      }
    });

    return concatStringArray.join(" ");
  }
};

const RowConcatHelper = {
  NOVALUE: NOVALUE,

  getCellAsString: function (cellValue, column, langtag) {
    let rowConcatString;

    if (column.kind === ColumnKinds.concat) {
      // each value can fallback to default language
      rowConcatString = internal.getRowConcatString(cellValue, column, langtag, TableauxConstants.DefaultLangtag);
    } else {
      // Text, Shorttext, etc.
      if (column.multilanguage) {
        rowConcatString = cellValue[langtag];

        // Link ID value is empty
        if (!internal.stringHasValue(rowConcatString)) {
          // Get default language fallback
          if (langtag !== TableauxConstants.DefaultLangtag) {
            rowConcatString = cellValue[TableauxConstants.DefaultLangtag];

            // Default language fallback is not empty. Postfix the langtag
            if (internal.stringHasValue(rowConcatString)) {
              rowConcatString = rowConcatString.concat(" (" + TableauxConstants.DefaultLangtag + ")");
            }
          }
        }
      } else {
        // Single language value
        rowConcatString = cellValue;
      }
    }

    return rowConcatString;
  },

  getCellAsStringWithFallback: function (cellValue, column, langtag) {
    // not really nice I think the Cell should replace
    // an empty concat value with "- NO VALUE -" and not
    // the model itself!
    const rowConcatString = this.getCellAsString(cellValue, column, langtag);
    return internal.stringHasValue(rowConcatString) ? rowConcatString : NOVALUE;
  }
};

module.exports = RowConcatHelper;
